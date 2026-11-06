# Portal Acadêmico — autenticação e autorização com sessão

## Objetivo do projeto

Projeto didático em Node.js que protege um portal com três páginas — `/login`, `/painel` e `/administracao` — usando autenticação local (e-mail e senha), sessão no servidor e autorização por perfil. O banco, o CSS e as views de login e administração já estavam prontos; esta versão implementa somente a camada de segurança.

## Instalação

```bash
npm install
```

Requer Node.js 18 ou superior.

## Configuração do `.env`

Copie o modelo e ajuste os valores:

```bash
cp .env.example .env
```

| Variável | Função |
| --- | --- |
| `PORT` | Porta do servidor (padrão `3000`). |
| `SESSION_SECRET` | Segredo que assina o cookie da sessão. Use um valor longo e aleatório fora da aula. Em `NODE_ENV=production` a aplicação não inicia sem ele. |
| `DATABASE_STORAGE` | Caminho do arquivo SQLite (padrão `./database/portal.sqlite`). |

O arquivo `.env` não deve ser versionado (já está no `.gitignore`).

## Execução

```bash
npm start      # executa uma vez
npm run dev    # reinicia ao alterar arquivos
```

Acesse `http://localhost:3000`. Na primeira execução, `server.js` cria as tabelas e as duas contas didáticas.

## Contas didáticas

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Estudante | `estudante@escola.test` | `aluno123` |
| Administrador | `admin@escola.test` | `admin123` |

## Fluxo do login

1. O formulário envia `email` e `senha` por `POST /login`.
2. O e-mail é normalizado (espaços removidos, minúsculas) e o usuário é localizado com `Usuario.findOne()`.
3. A senha é comparada com o `senhaHash` usando `bcrypt.compare()`. Nunca se usa `===`.
4. E-mail inexistente, senha incorreta e conta inativa produzem a mesma resposta: status **401** e a mensagem "E-mail ou senha inválidos.", sem revelar qual dado falhou. Quando o e-mail não existe, a comparação é feita contra um hash fictício para que o tempo de resposta não denuncie a existência da conta.
5. Se tudo confere, `req.session.regenerate()` troca o identificador da sessão (evita fixação de sessão).
6. A sessão guarda apenas `id`, `nome`, `email` e `perfil`. **Senha e hash nunca vão para a sessão.** O perfil vem do banco, nunca do formulário.
7. A sessão é salva e o usuário é redirecionado para `/painel`.

O navegador recebe somente o cookie `connect.sid` (`httpOnly`, `sameSite=lax`, `secure` em produção, validade de 2 horas); os dados ficam no servidor.

## Rotas públicas e protegidas

| Rota | Acesso | Resultado para quem não tem permissão |
| --- | --- | --- |
| `GET /` | Pública | Redireciona para `/login`. |
| `GET /login` | Pública | — |
| `POST /login` | Pública | 401 se as credenciais forem inválidas. |
| `GET /saude` | Pública | — |
| `GET /painel` | Usuário autenticado | Visitante é redirecionado para `/login`. |
| `GET /administracao` | Perfil `administrador` | Visitante vai para `/login`; estudante recebe **403**. |
| `POST /logout` | Sessão ativa | — |

## Autorização por perfil

Dois middlewares em `middlewares/autorizacao.js` fazem o trabalho:

- `exigirAutenticacao` redireciona para `/login` quando não há `req.session.usuario` e marca a resposta com `Cache-Control: no-store`, para que o botão "Voltar" não reabra páginas protegidas depois do logout.
- `exigirPerfil("administrador")` responde **403** quando o perfil da sessão é diferente do exigido.

`compartilharUsuario` publica o usuário da sessão em `res.locals.usuario`, e o cabeçalho se adapta a ele:

- visitante: apenas **Login**;
- estudante: **Painel** e **Sair**;
- administrador: **Painel**, **Administração** e **Sair**.

Esconder o link não protege nada: a rota `/administracao` valida o perfil no servidor, mesmo que alguém digite a URL.

## Logout

`POST /logout` destrói a sessão com `req.session.destroy()`, remove o cookie `connect.sid` e redireciona para `/login`. O logout usa `POST` (e não `GET`) para que links, imagens ou pré-carregamento do navegador não encerrem a sessão sem intenção do usuário.

## Execução dos testes

```bash
npm test
```

São sete testes, todos ativos (nenhum `skip`), executados com `node --test` e `supertest` sobre um banco SQLite em memória:

1. `GET /login` exibe o formulário;
2. `GET /saude` responde em JSON;
3. estudante autenticado abre o painel, com o cabeçalho adequado;
4. visitante é redirecionado do painel e da administração, e credenciais inválidas retornam 401 sem criar sessão;
5. estudante recebe 403 na administração;
6. administrador abre a administração;
7. logout encerra a sessão e remove `connect.sid`.

## Limitação do armazenamento em memória

O `express-session` usa por padrão o `MemoryStore`, que guarda as sessões na memória do processo. Por isso:

- ao reiniciar o servidor, todos os usuários são desconectados;
- as sessões não são compartilhadas entre várias instâncias;
- as sessões expiradas só deixam a memória quando são acessadas de novo, o que pode causar vazamento de memória.

Isso é aceitável para a aula, mas não para produção. Nesse caso, use um armazenamento persistente (por exemplo Redis ou um *store* baseado em banco de dados). Em produção, convém também servir a aplicação por HTTPS e acrescentar proteção contra CSRF.
