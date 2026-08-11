# Grupos de tags

## Fonte de verdade e permissões

Os grupos pertencem ao workspace e ficam em `workspace.resources.tagGroups`.
Owners, admins e editors podem criar, editar e excluir; viewers possuem acesso
somente para leitura. A feature não consome cotas do trial.

Cada grupo possui nome único no workspace e uma lista de tags armazenadas sem
o prefixo `#`. A normalização remove espaços externos e hashtags iniciais,
elimina duplicatas sem diferenciar maiúsculas de minúsculas e aceita letras
Unicode, números e underline.

## Uso em publicações

Ao selecionar um grupo no compositor, a publicação recebe um snapshot com o ID,
nome e tags daquele momento. Alterar ou excluir o grupo da biblioteca não modifica
publicações existentes. Em uma edição, o snapshot pode ser removido e o grupo
atual pode ser selecionado novamente.

O conteúdo efetivo é calculado sem alterar o texto-base: hashtags deduplicadas
são anexadas após uma linha em branco. O mesmo cálculo é usado para conteúdo-base,
overrides, contadores, validação por plataforma, previews e confirmação. Uma
publicação apenas com hashtags é considerada conteúdo textual válido.

## Persistência e API futura

A persistência local v4 migra workspaces v3 adicionando grupos e snapshots vazios,
sem apagar canais ou publicações. A futura API deverá implementar `GET/POST
/workspaces/:workspaceId/tag-groups` e `PATCH/DELETE
/workspaces/:workspaceId/tag-groups/:id`, repetindo autorização, unicidade e
validação das tags no servidor.
