# Gerenciamento de canais sociais

## Status atual

Canais são um domínio independente no back-end, exposto na seção `Channels` do
Swagger. Eles pertencem a um workspace, mas não ficam no módulo de workspaces
nem em `workspace.resources`. O PostgreSQL é a fonte persistente e o cache do
RTK Query é a fonte de verdade no front-end.

As integrações externas ainda não estão ativas:

| Plataforma | Estado atual   | Publicação real |
| ---------- | -------------- | --------------- |
| Facebook   | OAuth simulado | Não             |
| Instagram  | OAuth simulado | Não             |
| LinkedIn   | OAuth simulado | Não             |
| TikTok     | OAuth simulado | Não             |
| YouTube    | OAuth simulado | Não             |

O simulador não chama APIs externas, não cria tokens e não publica conteúdo.
Ele existe somente em `development` e `test`; a API recusa iniciar em
`staging` ou `production` com `CHANNEL_PROVIDER_MODE=mock`.

O seed cria três canais persistidos para o workspace demonstrativo: Facebook,
Instagram e LinkedIn. Esses registros são identificados como dados de
desenvolvimento e não são migrados do antigo armazenamento local.

## Modelo, estados e permissões

Um canal armazena a plataforma, o identificador da conta no provider, nome,
username, avatar e datas operacionais. Tokens e credenciais não fazem parte do
modelo atual; eles serão introduzidos com armazenamento criptografado quando o
primeiro provider real for implementado.

Estados disponíveis:

- `connected`: disponível para novas publicações;
- `requires_reauthentication`: ocupa uma vaga, mas precisa ser reconectado;
- `unavailable`: ocupa uma vaga, mas está temporariamente indisponível;
- `disconnected`: não ocupa vaga e aparece somente ao resolver referências
  históricas.

Qualquer membro pode listar e consultar canais. Somente owners e admins podem
conectar ou desconectar. A API recalcula a cota antes de iniciar e concluir a
conexão: workspaces em trial possuem três vagas; os demais usam a quantidade
configurada na assinatura.

A desconexão é lógica e idempotente. O registro permanece para que publicações
antigas continuem exibindo a conta correta. Uma autorização futura para a mesma
conta reativa o registro em vez de duplicá-lo.

## Endpoints

- `GET /workspaces/:workspaceId/channels`: listagem paginada com busca e filtro
  por plataforma. A resposta inclui um resumo global para uso e contadores.
- `GET /workspaces/:workspaceId/channels/lookup`: consulta leve para compositor,
  posts e calendário. `includeIds` resolve também referências desconectadas.
- `POST /workspaces/:workspaceId/channels/oauth/:platform/start`: valida papel,
  cota e rate limit e cria um `state` no Redis com validade de dez minutos.
- `GET /channels/oauth/mock/callback`: consome o `state` uma única vez, persiste
  uma conta simulada e redireciona para `/channels`.
- `DELETE /workspaces/:workspaceId/channels/:channelId`: desconecta o canal.

O callback usa `WEB_APP_URL` configurada no servidor e nunca aceita uma URL de
retorno enviada pelo navegador. O endereço público da API vem de
`API_PUBLIC_URL`.

## Front-end e consumidores

A página `/channels` mantém busca, plataforma, página e tamanho nos search
params. Paginação e filtros são processados no servidor. Erros da listagem são
traduzidos pelo código da API e exibidos dentro da tabela com retry.

Mutations invalidam a tag `Channel`. Os demais módulos não copiam canais para
Redux:

- compositor usa lookup e aceita somente canais `connected`;
- posts e calendário enviam IDs dos targets em `includeIds`;
- dashboard usa o resumo da API;
- assinatura usa o total remoto para calcular o mínimo ocupado.

## Evolução para providers reais

Cada provider real deve implementar a interface interna de autorização,
callback, leitura da conta e revogação. A entrada deve ser gradual, sem alterar
os contratos públicos do domínio.

Antes da liberação serão necessários credenciais próprias, HTTPS e redirect
URIs estáveis, política de privacidade, termos, exclusão de dados e as revisões
exigidas por cada plataforma. Nessa etapa também serão adicionados credenciais
criptografadas, refresh de tokens, health checks, webhooks e publicação real.

Até isso ocorrer, nenhuma tela deve afirmar que uma ação foi realizada em uma
rede social; o ambiente de desenvolvimento informa explicitamente que a conexão
é simulada.
