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

Uma publicação agrega texto e mídia base e possui um target por canal. O conteúdo
pode ser personalizado por plataforma e é aplicado a todos os targets daquela rede.
As regras ficam
centralizadas em `features/posts/lib/platform-rules.ts`. O protótipo usa URLs de
objeto temporárias para uploads; no produto, URLs assinadas e com expiração deverão
vir do serviço de mídia do backend.

Grupos selecionados são preservados como snapshots na publicação. As hashtags
deduplicadas são anexadas ao conteúdo-base e aos overrides somente ao calcular o
conteúdo efetivo para validação, preview e envio; o texto digitado permanece separado.
Quando uma plataforma é personalizada, ela pode possuir seus próprios snapshots de
grupos de tags. Esses snapshots são aplicados a todos os targets daquela plataforma;
as demais redes continuam utilizando os grupos definidos no conteúdo-base.
As decisões completas estão em [`tags.md`](tags.md).

## Mídia e retenção

Imagens e vídeos são ativos temporários, mantidos somente enquanto forem necessários
para rascunho, agendamento, processamento e retry. O arquivo original não deve ser
copiado por target nem preservado indefinidamente depois da confirmação das redes.

O backend deverá aplicar uma política automática de ciclo de vida:

- manter a mídia de publicações agendadas até todos os targets terminarem;
- manter falhas durante uma janela curta e configurável de retry;
- remover originais após uma pequena margem de segurança quando todos os targets
  estiverem publicados;
- expirar mídia de rascunhos abandonados;
- usar referências e contagem de uso para nunca excluir um ativo ainda necessário.

O histórico priorizará `externalUrl`, ligando o usuário à publicação real em cada
rede. Quando uma representação visual local for necessária, deverá ser armazenada
somente uma thumbnail otimizada, pequena e sem metadados, nunca uma cópia do arquivo
original. Depois da remoção do original, duplicar uma publicação antiga exigirá um
novo upload de mídia.

Recorrência fica fora do escopo. Ela exigiria retenção potencialmente indefinida dos
originais e uma infraestrutura própria para séries, ocorrências e cancelamento, em
conflito com a política de mídia temporária do MVP.

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
armazenará credenciais sociais. Jobs de ciclo de vida deverão remover objetos
expirados e registrar a limpeza de forma idempotente.
