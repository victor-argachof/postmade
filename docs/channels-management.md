# Gerenciamento de canais sociais

Este documento registra as decisões arquiteturais da feature de canais sociais e
a divisão de responsabilidades entre o front-end atual e a futura integração com
o back-end.

## Plataformas do MVP

O Postmade oferece suporte às seguintes plataformas:

- Facebook;
- LinkedIn;
- Instagram;
- TikTok;
- YouTube.

`SocialPlatform`, definido em `packages/types`, é o contrato compartilhado que
representa essa lista. X/Twitter não faz parte do MVP e não deve ser introduzido
em dados, componentes ou contratos da feature.

## Fonte de verdade e isolamento

Os canais pertencem a um workspace e são armazenados exclusivamente em
`workspace.resources.channels`. Não existe um slice global de canais.

Essa decisão garante que:

- trocar o workspace ativo troca imediatamente os canais exibidos;
- conexão e desconexão sempre informam o `workspaceId` de destino;
- a persistência local existente para workspaces inclui os canais;
- não há sincronização manual entre duas representações concorrentes.

`SocialChannel`, também definido em `packages/types`, contém somente os dados
necessários para identificar a conta e seu estado de conexão. Novos campos devem
ser adicionados apenas quando um contrato real com o back-end exigir essa
informação.

## Permissões e limites

Owners e admins podem conectar e desconectar canais. Editors e viewers possuem
acesso somente para leitura. A interface comunica e desabilita ações sem
permissão, mas operações locais também validam o papel no reducer. O back-end
deverá repetir essas validações; o estado ou os controles do navegador nunca são
uma fronteira de segurança.

Os limites são calculados por `getWorkspaceChannelLimit`, em
`features/workspaces/lib/workspace-limits.ts`:

| Situação | Limite de canais |
| --- | ---: |
| Avaliação gratuita | 3 |
| Creator ativo | 15 |
| Growth ativo | 50 |
| Pro ativo | Ilimitado |

Componentes não devem duplicar esses números. Um limite `null` representa uso
ilimitado. A quantidade utilizada considera apenas canais com `connected: true`.

## Listagem e gerenciamento

Os canais conectados são apresentados em uma tabela, em vez de cards individuais,
para que a interface continue utilizável em workspaces Pro com muitas contas. A
tabela exibe plataforma, identificação da conta, status e ações disponíveis.

A estrutura genérica fica em `shared/components/data-table.tsx`. A definição das
colunas e o comportamento específico dos canais permanecem dentro da feature. Essa
separação permite reutilizar a tabela sem levar regras de canais para a camada
compartilhada.

A listagem oferece:

- busca local por nome de exibição ou username;
- filtro pelas cinco redes sociais suportadas;
- contador de resultados após a aplicação dos filtros;
- seleção de 10, 25 ou 50 resultados por página;
- navegação por páginas, incluindo primeira, última e páginas adjacentes;
- retorno à primeira página quando a busca, o filtro ou a quantidade por página muda;
- empty state específico quando nenhum canal corresponde aos filtros.

Os filtros ficam fora da tabela e são implementados dentro da feature. A estrutura
de paginação é compartilhada por meio de `shared/components/Pagination.tsx`. Busca
e paginação são locais enquanto os dados também forem locais. Quando o back-end
oferecer uma listagem paginada, busca, plataforma, página e tamanho da página
deverão ser enviados como parâmetros da API.

A desconexão exige confirmação e informa o nome da conta e sua plataforma. Somente
owners e admins recebem uma ação habilitada; o reducer repete a autorização antes
de alterar o workspace.

## Fluxo OAuth

O contrato do front-end para iniciar uma conexão é:

```ts
type GetOAuthUrlInput = {
  workspaceId: string;
  platform: SocialPlatform;
};

type GetOAuthUrlOutput = {
  url: string;
};
```

O fluxo esperado é:

1. O usuário seleciona uma plataforma.
2. O front-end solicita a URL OAuth para o workspace ativo.
3. O navegador é redirecionado para a URL retornada.
4. Uma falha na solicitação produz feedback traduzido e não altera os canais.

Enquanto não há back-end, não existe seed nem simulação persistida de conexão. No
modo de desenvolvimento, uma conta temporária pode ser renderizada somente na
camada de apresentação para revisão visual; ela não é gravada no Redux ou no
`localStorage`. Os canais persistidos localmente continuam disponíveis para
visualização e testes, e tentativas de conexão apresentam o erro normal da
integração indisponível.

Tokens de acesso, refresh tokens, client secrets e demais credenciais OAuth nunca
devem ser incluídos no bundle, no Redux ou no `localStorage` do front-end.

## Estado e saúde da conexão

O contrato atual utiliza apenas `connected: boolean`. Ele é suficiente para a
demonstração da interface, mas não representa credenciais expiradas, autorização
revogada ou indisponibilidade temporária de uma API externa.

Quando o back-end implementar a verificação das conexões, o booleano deverá ser
substituído por um único estado explícito, evitando duas propriedades que possam
se contradizer. Uma direção inicial possível é:

```ts
type ChannelConnectionStatus =
  | "connected"
  | "requires_reauthentication"
  | "unavailable";

interface SocialChannel {
  id: string;
  platform: SocialPlatform;
  displayName: string;
  username: string;
  connectionStatus: ChannelConnectionStatus;
  lastCheckedAt: string | null;
}
```

Essa estrutura é uma direção de evolução, não um contrato implementado. Os nomes,
transições e motivos de falha devem ser confirmados a partir das respostas e dos
processos reais do back-end.

A interface poderá representar os estados da seguinte forma:

| Estado | Significado | Tratamento esperado |
| --- | --- | --- |
| `connected` | Credenciais válidas e conta disponível | Status positivo. |
| `requires_reauthentication` | Credenciais expiradas ou autorização revogada | Aviso e ação para reconectar. |
| `unavailable` | Não foi possível validar ou usar a conexão | Erro temporário e nova tentativa. |

Problemas individuais de autenticação não devem ser confundidos com a
indisponibilidade global de uma plataforma. Uma falha geral do Instagram ou do
YouTube, por exemplo, deve ser representada separadamente, sem alterar em massa o
estado persistido de todas as contas. `lastCheckedAt` pode ser exibido como texto
secundário ou tooltip, sem expor tokens ou detalhes sensíveis do provedor.

O back-end será a fonte de verdade para a saúde da conexão. Ele deverá atualizar o
status durante sincronizações, tentativas de publicação ou verificações periódicas,
e retornar ao front-end somente informações seguras e acionáveis.

## Continuidade no back-end

A integração futura deverá:

1. Validar associação ao workspace, papel do usuário e limite antes de iniciar o OAuth.
2. Gerar `state` OAuth de uso único, associado ao workspace, usuário e plataforma.
3. Processar o callback e trocar o código por credenciais exclusivamente no servidor.
4. Armazenar credenciais criptografadas e retornar ao front-end somente metadados seguros da conta.
5. Sincronizar `workspace.resources.channels` por API após conexão, reconexão ou revogação.
6. Revogar credenciais e interromper publicações futuras ao desconectar uma conta.
7. Tratar callbacks e desconexões de forma idempotente e auditável.
8. Verificar periodicamente a validade das conexões e registrar a última checagem.
9. Diferenciar falhas de uma conta de indisponibilidades gerais da plataforma.

O callback OAuth, a persistência de credenciais e o endpoint servidor de
desconexão não fazem parte da implementação atual do front-end.
