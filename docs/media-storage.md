# Armazenamento temporário de mídia

## Objetivo

O Postmade usa um bucket privado Cloudflare R2 como armazenamento operacional temporário. O R2 não é o arquivo permanente das publicações: os objetos são removidos depois que deixam de ser necessários para publicação, retry ou preview.

## Configuração

Cada ambiente deve usar bucket e credenciais próprios, com classe Standard. A API exige `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID` e `R2_SECRET_ACCESS_KEY`. O endpoint S3 é derivado como `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, com região `auto`. `R2_API_TOKEN` e `S3_API_ENDPOINT` não fazem parte da configuração da aplicação. Nenhuma credencial R2 pode ser exposta ao front-end.

No bucket, configure uma regra lifecycle de segurança para excluir objetos após 120 dias e cancelar multipart incompleto após um dia. A aplicação continua sendo responsável pela exclusão normal.

### CORS do bucket

Restrinja `AllowedOrigins` às origens reais do front-end, permita `PUT`, `GET` e `HEAD`, e autorize `Content-Type`:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Fluxo e segurança

1. O navegador solicita `POST /workspaces/:workspaceId/media/uploads`.
2. A API persiste um ativo `pending` e retorna uma URL PUT assinada por 15 minutos.
3. O navegador envia o arquivo diretamente ao R2 com os headers retornados.
4. O navegador chama `POST /workspaces/:workspaceId/media/:mediaId/complete`.
5. A API confere metadados com `HeadObject`, lê o prefixo do objeto para validar sua assinatura e marca o ativo como `ready`.
6. Publicações referenciam `mediaIds`; previews usam URLs GET de 15 minutos obtidas em `/access`.

URLs assinadas são bearer tokens e não devem aparecer em logs. As chaves seguem `workspaces/{workspaceId}/media/{mediaId}/original`, mas nunca são retornadas pela API.

## Formatos e limites

- JPEG, PNG e WebP: até 10 MB.
- MP4 e QuickTime/MOV: até 100 MB.
- PUT simples; multipart, retomada, thumbnails e transcodificação ficam fora desta versão.

Rascunhos podem ser incompletos. Agendamento e publicação exigem ativos `ready`, do mesmo workspace e compatíveis com todos os targets.

## Retenção e cleanup

- upload pendente ou pronto não anexado: 24 horas;
- rascunho: sete dias desde a última atualização;
- agendado ou em processamento: preservado até a conclusão;
- falha: sete dias para retry;
- publicado: 48 horas.

Uma fila BullMQ agenda o cleanup a cada hora no Redis existente. O ativo expirado é reivindicado como `deleting`, removido e marcado como `deleted`. Ausência no R2 equivale a sucesso; falhas temporárias usam retry e backoff. Metadados e associações permanecem para auditoria, mas objetos deletados são omitidos das respostas. Em referências compartilhadas, prevalece a retenção mais longa; duplicações preservam somente originais disponíveis.

Monitore os totais `examined`, `deleted` e `failed`, sem nomes, chaves ou URLs. Falhas do R2 retornam `MEDIA_STORAGE_UNAVAILABLE`; tipo, tamanho, expiração, estado e uso possuem códigos estáveis próprios.
