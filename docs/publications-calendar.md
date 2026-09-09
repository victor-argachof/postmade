# Publicações e calendário

## Fonte de verdade

As publicações pertencem ao workspace e são persistidas pela API. O cache do RTK
Query é a fonte de verdade no navegador; slices guardam apenas estado transitório
da interface. Trocar de workspace altera a chave das consultas e atualiza
imediatamente listagem, calendário e dashboard.

Publicações possui dois modos de visualização: Lista, acessível em `/posts`, e
Calendário, acessível em `/posts/calendar`. Ambos fazem parte da feature `posts` e
utilizam a mesma fonte de dados.

## Permissões e trial

Owners, admins e editors podem criar, editar, duplicar, cancelar e excluir.
Viewers têm acesso somente para leitura. Publicações concluídas são imutáveis.
Durante o trial, cada envio imediato ou agendamento consome um dos três usos,
independentemente da quantidade de canais; rascunhos não consomem a cota.

## Conteúdo multicanal

Cada publicação pode ter um `title` opcional de até 120 caracteres. Ele é um
metadado interno de organização, pesquisável e editável mesmo após a conclusão, e
nunca integra o conteúdo enviado às redes. Títulos nativos de plataformas, como o
do YouTube, deverão ser modelados futuramente nas configurações do target.

Uma publicação agrega texto e mídia base e possui um target por canal. O conteúdo
pode ser personalizado por plataforma e é aplicado a todos os targets daquela rede.
As regras ficam
centralizadas em `features/create-post/lib/platform-rules.ts`. O protótipo usa URLs de
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

O upload é feito diretamente para um bucket privado Cloudflare R2 por URL PUT
assinada. Publicações persistem associações ordenadas por `mediaIds`; previews usam
URLs GET temporárias. As regras completas estão em
[`media-storage.md`](media-storage.md).

O backend aplica uma política automática de ciclo de vida:

- manter a mídia de publicações agendadas até todos os targets terminarem;
- manter falhas durante uma janela curta e configurável de retry;
- remover originais após uma pequena margem de segurança quando todos os targets
  estiverem publicados;
- expirar mídia de rascunhos abandonados;
- usar referências e contagem de uso para nunca excluir um ativo ainda necessário.

Uploads sem publicação expiram em 24 horas, rascunhos em sete dias, falhas em sete
dias e originais publicados em 48 horas. O lifecycle de 120 dias no R2 é uma
proteção contra objetos órfãos.

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
query string. Rascunhos sem data não aparecem no calendário. Agendamentos devem
estar entre cinco minutos e 90 dias no futuro; o servidor valida em UTC e a
interface antecipa os mesmos limites.

Owners e admins podem alterar o fuso em `/workspace/settings`. A mudança afeta a
exibição e novos agendamentos, mas não modifica os instantes UTC de publicações
já agendadas. Offsets fixos não devem ser usados, pois não representam mudanças
regionais e regras de horário de verão.

## API persistente

A API oferece listagem filtrada e paginada, consulta individual, criação,
atualização, exclusão, duplicação, cancelamento e retry sob
`/workspaces/:workspaceId/publications`. O servidor repete validações de
associação, papel, trial, canais, plataforma e datas.

Nesta primeira integração, `Publicar agora` persiste imediatamente o estado
`published`, de forma simulada e sem chamar redes externas. Upload de mídia ainda
não está disponível: rascunhos podem permanecer incompletos, mas plataformas que
exigem mídia não podem ser agendadas ou publicadas. Filas, envio real, retry do
provedor e ciclo de vida de objetos permanecem como continuidade do backend.
