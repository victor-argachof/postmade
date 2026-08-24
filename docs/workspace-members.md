# Convites e membros do workspace

O gerenciamento de equipe pertence ao workspace. Os papéis disponíveis são
`owner`, `admin`, `editor` e `viewer`; convites aceitam apenas os três últimos.

## Roles e traduções

Os identificadores das roles fazem parte do contrato técnico e permanecem em
inglês no banco e na API. Na interface, devem ser apresentados com as traduções
abaixo:

| Identificador | Português     | Inglês |
| ------------- | ------------- | ------ |
| `owner`       | Proprietário  | Owner  |
| `admin`       | Administrador | Admin  |
| `editor`      | Editor        | Editor |
| `viewer`      | Leitor        | Viewer |

Textos voltados ao usuário não devem exibir os identificadores `owner` ou
`admin`. Em frases descritivas, use “proprietário(s)” e “administrador(es)” em
português. Para mencionar a permissão do usuário, prefira “nível de acesso” a
“papel” ou “role”.

## Permissões

| Operação                          | Owner | Admin | Editor | Viewer |
| --------------------------------- | :---: | :---: | :----: | :----: |
| Convidar editor/viewer            |  sim  |  sim  |  não   |  não   |
| Convidar ou gerenciar admin       |  sim  |  não  |  não   |  não   |
| Alterar/remover editor/viewer     |  sim  |  sim  |  não   |  não   |
| Gerenciar assinatura/proprietário |  sim  |  não  |  não   |  não   |

Nenhum ator altera o próprio papel ou remove a si mesmo. Transferência de
propriedade e saída voluntária não fazem parte deste fluxo.

## Ciclo de vida

Convites expiram em sete dias. Somente o hash do token é persistido; reenviar
rotaciona o token e reinicia a validade. Convites pendentes não expirados ocupam
uma vaga da assinatura. A criação, o reenvio de convite expirado e o aceite
revalidam a cota sob lock transacional do workspace.

O convidado consulta `/workspace-invitations/:token`, autentica-se e confirma o
aceite explicitamente. O e-mail verificado deve corresponder ao convite. Cadastro
iniciado por convite não cria workspace pessoal; cadastro normal continua criando
um workspace em avaliação.

## API

As rotas autenticadas sob `/workspaces/:workspaceId` listam membros e convites,
criam/revogam/reenviam convites e alteram/removem membros. A consulta do token é
pública; `POST /workspace-invitations/:token/accept` exige sessão. Erros usam os
códigos estáveis `INVITATION_*` e `WORKSPACE_MEMBER_*` do pacote compartilhado.
