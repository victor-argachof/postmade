# Publicações e calendário

## Fonte de verdade

As publicações pertencem ao workspace e ficam exclusivamente em
`workspace.resources.posts`. Os slices de posts e calendário guardam apenas estado
transitório da interface. Trocar de workspace troca imediatamente a listagem e o
calendário.

## Permissões e trial

Owners, admins e editors podem criar, editar, duplicar, cancelar e excluir.
Viewers têm acesso somente para leitura. Publicações concluídas são imutáveis.
Durante o trial, cada envio imediato ou agendamento consome um dos três usos,
independentemente da quantidade de canais; rascunhos não consomem a cota.

## Conteúdo multicanal

Uma publicação agrega texto e mídia base e possui um target por canal. Cada target
pode sobrescrever o texto, a mídia e configurações específicas. As regras ficam
centralizadas em `features/posts/lib/platform-rules.ts`. O protótipo usa URLs de
objeto temporárias para uploads; URLs definitivas deverão vir do backend.

## Datas e calendário

O workspace possui um timezone IANA. A interface exibe datas nesse fuso e persiste
instantes em UTC. O calendário oferece mês e agenda, com mês/data selecionados na
query string. Rascunhos sem data não aparecem no calendário.

Owners e admins podem alterar o fuso em `/workspace/settings`. A mudança afeta a
exibição e novos agendamentos, mas não modifica os instantes UTC de publicações
já agendadas. Offsets fixos não devem ser usados, pois não representam mudanças
regionais e regras de horário de verão.

## Continuidade no backend

A futura API deverá oferecer listagem filtrada, criação, atualização, exclusão,
duplicação, retry e upload sob `/workspaces/:workspaceId`. O servidor repetirá
validações de associação, papel, trial, canais, plataforma e datas. Publicação e
retry serão assíncronos, idempotentes e executados por filas; o navegador nunca
armazenará credenciais sociais.
