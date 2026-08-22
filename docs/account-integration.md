# Integração da conta

A rota `/me` é a fonte da sessão autenticada. Alterações de perfil ou e-mail
devem atualizar o auth slice, o cache de `/me` e a identidade do usuário nos
workspaces somente depois de a API confirmar a persistência.

## Endpoints

- `PATCH /account/profile`: altera o nome para contas nativas e Google.
- `POST /account/email/change/start`: envia um código ao novo e-mail.
- `POST /account/email/change/verify`: confirma o código e altera o e-mail.
- `POST /account/email/change/resend`: reenvia o código respeitando o cooldown.
- `PATCH /account/password`: valida a senha atual e grava a nova senha.

A troca de e-mail exige uma sessão válida e o código recebido no novo endereço;
ela não solicita a senha atual. Trocas de e-mail e senha revogam as outras
sessões, preservando a sessão corrente.

Contas Google podem alterar o nome, mas a API rejeita alterações de e-mail e
senha com `ACCOUNT_PROVIDER_RESTRICTED`. Essa regra existe no servidor mesmo
quando o front-end oculta os formulários.

## Organização no front-end

As chamadas HTTP ficam em `features/account/services/account-api.ts`. Os
componentes controlam estado de formulário e apresentação. A sincronização
reutilizada por perfil e e-mail fica em `features/account/lib`, sem criar hooks
que apenas renomeiem mutations.

Erros usam os códigos compartilhados de `@postmade/types`; o front-end os mapeia
para chaves do namespace `apiErrors`. Mensagens retornadas pela API não devem ser
exibidas diretamente ao usuário.
