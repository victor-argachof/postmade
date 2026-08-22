# Decisão: contrato de erros da API

## Contexto

O Postmade possui uma API e um front-end multilíngue no mesmo monorepo. Mensagens
textuais retornadas pelo servidor não são um contrato confiável e não devem definir
o comportamento nem o idioma da interface.

## Decisão

A API retorna erros com código estável e mensagem técnica:

```json
{
  "statusCode": 400,
  "code": "INVALID_CODE",
  "message": "Verification code is invalid"
}
```

Erros de validação podem incluir detalhes estruturados:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [{ "field": "email", "code": "INVALID_EMAIL" }]
}
```

Os códigos ficam em `packages/types/src/api/errors.ts`. O back-end usa o helper
`apiError(...)`, e o front-end mantém um mapa exaustivo de código para chave do
namespace `apiErrors`.

## Consequências

- A interface traduz erros no idioma ativo.
- O comportamento não depende da mensagem técnica.
- Um código sem mapeamento faz o typecheck do front-end falhar.
- Códigos desconhecidos e falhas de rede possuem fallbacks seguros.
- Todo novo código exige atualização do contrato e das traduções.

## Fora do escopo atual

Não adotamos `application/problem+json`. O formato atual atende aos consumidores
internos e pode ser revisto se a API se tornar pública ou receber novos clientes.
