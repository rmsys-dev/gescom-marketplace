# GESCOM App

Frontend do **Gescom**, sistema web **ERP** da **RMSys**.

## Confidencialidade

Este repositório é **privado** e de uso exclusivo da RMSys. O código-fonte é **proprietário e confidencial**: não pode ser copiado, distribuído, replicado ou utilizado fora do escopo autorizado pela empresa. O acesso é restrito a colaboradores e parceiros com permissão explícita.

## Contrato de feature

Cada domínio fica em `src/features/<feature>/`. O contrato mínimo é:

| Pasta | Papel |
| --- | --- |
| `api` | Chamadas HTTP e query keys |
| `hooks` | React Query e hooks de UI da feature |
| `rules` | Funções puras (cálculo, elegibilidade, mensagens) |
| `components` | UI da feature |

Pastas opcionais que o repositório já usa: `schemas`, `constants`, `lib`, `types`. `server` só em autenticação; `services` só em produtos.

A superfície pública da feature é o `index.ts` na raiz dela. `src/app` só compõe rotas e cascas de página. Código transversal (UI base, validação, erros, listagens) fica em `src/shared`.

Aliases canônicos (ver `tsconfig.json`): `@/features/*`, `@/shared/*` e `@/shared/lib`. O atalho `@/lib` não existe e não deve voltar. No `components.json` do shadcn, a chave `"lib"` aponta para `@/shared/lib` — isso é configuração do gerador, não o alias antigo.

## Licença e propriedade intelectual

Copyright © **RMSys**. Todos os direitos reservados.

Este software é **proprietário** e licenciado de forma **exclusiva** para a RMSys e seu uso interno no ecossistema Gescom. Não é software de código aberto: a reprodução, redistribuição, engenharia reversa, sublicenciamento ou qualquer uso não autorizado é **expressamente proibido**.

Para dúvidas sobre acesso, uso ou permissões, entre em contato com a RMSys.
