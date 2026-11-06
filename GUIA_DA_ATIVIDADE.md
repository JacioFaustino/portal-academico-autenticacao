# Guia da atividade

## Situação-problema

O Portal Acadêmico possui uma tela de login, mas o painel e a administração ainda podem ser abertos sem autenticação. Sua missão é implementar a camada de segurança sem reconstruir as views, o CSS ou o banco.

## Ordem de implementação

1. Leia `app.js`, `routes/autenticacao.js` e `middlewares/autorizacao.js`.
2. Execute o projeto e confirme que as rotas estão desprotegidas.
3. Configure `express-session` antes das rotas.
4. Implemente a validação do login.
5. Armazene somente dados seguros em `req.session.usuario`.
6. Complete `exigirAutenticacao`.
7. Complete `exigirPerfil`.
8. Implemente o logout por `POST`.
9. Remova progressivamente `test.skip`.
10. Execute `npm test` até todos os testes serem aprovados.

## Regras

- não armazenar senha ou hash na sessão;
- não comparar senhas com `===`;
- não confiar em perfil enviado pelo formulário;
- não proteger a administração somente ocultando o link;
- não usar `GET` para logout;
- não mostrar se o erro ocorreu no e-mail ou na senha;
- sempre chamar `next()` quando o middleware permitir a continuação.

## Evidências esperadas

- visitante não abre o painel;
- senha incorreta não cria sessão;
- estudante abre o painel;
- estudante não abre a administração;
- administrador abre a administração;
- logout encerra o acesso autenticado.
