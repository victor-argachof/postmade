# Fluxo de autenticação e cadastro

## Decisão de produto

O Postmade oferece exatamente dois tipos independentes de conta:

1. conta nativa, autenticada com e-mail e senha;
2. conta Google, autenticada exclusivamente pelo Google.

Cada usuário possui uma única identidade de autenticação. Vincular ou
desvincular provedores e adicionar uma senha a uma conta Google estão
explicitamente fora do escopo.

## Modelo de identidade

O identificador do usuário no Postmade é interno, opaco e imutável. Ele não
deve ser construído a partir do e-mail.

```ts
type AuthUser = {
  id: string;
  name: string;
  email: string;
  identity: {
    provider: "password" | "google";
    providerSubject: string;
    emailVerified: boolean;
  };
};
```

Para uma conta Google, `providerSubject` deve receber o claim OIDC `sub` obtido
de um ID token validado pelo backend. O e-mail não pode ser usado para localizar
a identidade Google, pois ele pode mudar. Para uma conta nativa,
`providerSubject` também deve ser um identificador opaco e estável da credencial.

O front-end atual é demonstrativo: quando ainda não recebe esses valores de uma
API, o Redux gera identificadores opacos locais. Isso não substitui a validação
e a persistência no backend.

## Cadastro nativo

1. O usuário informa nome, e-mail e senha.
2. O backend normaliza o e-mail e verifica se ele já pertence a qualquer conta.
3. Se o e-mail pertencer a uma conta Google, o cadastro é bloqueado e a
   interface orienta o usuário a entrar com Google.
4. Se pertencer a uma conta nativa, o cadastro é bloqueado e a interface orienta
   o usuário a entrar.
5. O Postmade envia e valida o código de verificação do e-mail.
6. Somente depois da verificação o backend cria o usuário, sua identidade nativa
   e a sessão.
7. O workspace inicial é associado ao `user.id` interno.

Senhas devem ser armazenadas apenas pelo serviço de autenticação, usando um
algoritmo de hash apropriado. Elas nunca fazem parte do estado do front-end.

## Login nativo

1. O usuário informa e-mail e senha.
2. Se o e-mail estiver associado a uma conta Google, o login nativo é bloqueado
   e a interface orienta o uso de **Entrar com o Google**.
3. Para uma conta nativa, o backend valida a senha e cria uma sessão para o
   `user.id` existente.
4. Falhas de credenciais devem usar mensagem genérica em produção para evitar
   enumeração de contas.

A verificação por código exibida atualmente é parte do protótipo. O backend
deverá definir se ela será exigida em todo login, apenas no cadastro ou com base
em risco.

## Cadastro e login com Google

O mesmo botão inicia o fluxo OIDC nos dois contextos:

1. O front-end inicia Authorization Code Flow com PKCE.
2. O backend valida o ID token, incluindo assinatura, `iss`, `aud`, expiração e
   nonce.
3. O backend procura a identidade usando `(provider = google,
providerSubject = sub)`.
4. Se ela existir, cria uma sessão para o `user.id` correspondente.
5. Se não existir, verifica se o e-mail verificado informado pelo Google já
   pertence a uma conta nativa.
6. Se pertencer, o fluxo é bloqueado e o usuário é orientado a entrar com e-mail
   e senha. Não ocorre vinculação automática.
7. Se não pertencer, cria um novo usuário, uma identidade Google contendo o
   `sub` e uma sessão.

Em logins futuros, alterações do e-mail retornado pelo Google podem atualizar a
cópia exibida pelo Postmade, mas nunca alteram o `user.id` ou o
`providerSubject` usado para localizar a conta.

## Alteração de dados cadastrais

### Conta nativa

- O nome é editável no Postmade.
- O e-mail pode ser alterado após reautenticação, verificação do novo endereço e
  validação de unicidade.
- A senha pode ser alterada após confirmação da senha atual ou por um fluxo
  seguro de recuperação.
- Alterar o e-mail nunca altera o `user.id` nem o `providerSubject`.

### Conta Google

- O nome de exibição é um dado do Postmade e pode ser editado.
- O e-mail da identidade é somente leitura no Postmade e é gerenciado pelo
  Google.
- A conta não possui senha no Postmade.
- A interface não oferece criar senha, trocar senha, vincular Google ou
  desvincular Google.

## Conflitos de e-mail

| Conta existente | Tentativa                                | Resultado                          |
| --------------- | ---------------------------------------- | ---------------------------------- |
| Nativa          | Cadastro nativo com o mesmo e-mail       | Bloquear e orientar login          |
| Nativa          | Google com o mesmo e-mail                | Bloquear e orientar e-mail e senha |
| Google          | Cadastro/login nativo com o mesmo e-mail | Bloquear e orientar Google         |
| Google          | Google com o mesmo `sub`                 | Entrar na conta existente          |

Coincidência de e-mail nunca autoriza mesclagem ou vinculação de contas.

## Fora do escopo

Os itens abaixo não devem ser implementados sem uma nova decisão de produto e
uma revisão específica de segurança:

- adicionar senha a uma conta Google;
- conectar Google a uma conta nativa;
- vincular múltiplos provedores;
- desvincular ou trocar o provedor de uma conta;
- mesclar contas existentes;
- recuperar uma conta Google por meio de senha do Postmade.

Se o usuário perder acesso ao Google, a recuperação deve ocorrer no próprio
Google. O suporte do Postmade não deve converter manualmente a conta para uma
identidade nativa.
