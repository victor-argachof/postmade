# Dashboard

O dashboard é a visão operacional inicial do workspace, disponível em
`/dashboard`. Ele deriva todas as informações de `workspace.resources` e não
mantém estado persistido próprio.

## Informações

Os indicadores apresentam canais conectados, rascunhos, agendamentos e falhas.
Os indicadores navegam para a área correspondente; indicadores de publicação
aplicam o filtro de status antes de abrir a lista.

A seção de próximas publicações considera somente itens com status `scheduled`
e data futura, ordena cronologicamente e limita o resultado a cinco. Datas e
links para o calendário são calculados no fuso horário do workspace.

## Permissões

Owners, admins e editors visualizam atalhos para criar publicações. Viewers têm
acesso aos indicadores, calendário, canais e tags, mas não recebem ações de
criação. Métricas de alcance e engajamento dependem das futuras integrações com
as plataformas e não fazem parte do MVP local.
