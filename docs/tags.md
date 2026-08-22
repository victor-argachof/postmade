# Grupos de tags

## Domínio e permissões

Tags são uma feature independente, exposta na seção `Tags` do Swagger. Os
grupos pertencem a um workspace, por isso as rotas usam o prefixo
`/workspaces/:workspaceId/tag-groups`, sem colocar regras de tags no módulo de
workspaces.

Qualquer membro pode listar e pesquisar grupos. Owners, admins e editors podem
criar, editar e excluir; viewers possuem acesso somente para leitura. Os grupos
não consomem cotas de trial ou assinatura.

Cada grupo tem nome único no workspace. O servidor remove espaços externos e o
prefixo `#`, elimina duplicatas sem diferenciar caixa e aceita letras Unicode,
números e underline. O nome possui até 80 caracteres; cada grupo contém de 1 a
30 hashtags, com até 50 caracteres cada.

## Endpoints

- `GET /workspaces/:workspaceId/tag-groups`: administração paginada, com busca
  e ordenação no servidor.
- `GET /workspaces/:workspaceId/tag-groups/lookup`: busca leve utilizada pelo
  compositor.
- `POST /workspaces/:workspaceId/tag-groups`: criação.
- `PATCH /workspaces/:workspaceId/tag-groups/:tagGroupId`: edição.
- `DELETE /workspaces/:workspaceId/tag-groups/:tagGroupId`: exclusão.

A listagem aceita `page`, `pageSize`, `query`, `sortBy` e `sortDirection`. O
lookup aceita `query`, `limit` e `includeIds`; sua resposta informa opções e os
IDs selecionados que ainda existem. Isso evita baixar toda a biblioteca e
permite distinguir um resultado ausente de um grupo realmente excluído.

No front-end, o cache do RTK Query é a fonte de verdade. Grupos não são copiados
para o slice de workspaces. A página administrativa mantém paginação, busca e
ordenação na URL, enquanto o compositor consulta o lookup somente ao abrir o
seletor.

## Uso em publicações

Ao selecionar um grupo, a publicação recebe um snapshot com ID, nome e tags
daquele momento. Alterar ou excluir o grupo não modifica publicações ou seleções
já salvas. Snapshots cujo grupo foi removido continuam visíveis e podem ser
retirados manualmente.

As hashtags dos snapshots são deduplicadas e anexadas ao conteúdo após uma linha
em branco. Cada plataforma personalizada pode substituir os snapshots globais
por sua própria seleção.
