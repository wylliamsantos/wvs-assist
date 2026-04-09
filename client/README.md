# BMAD Client

## Pré-requisitos
- Bun >= 1.3 (usar `~/.bun/bin/bun`).
- Ambiente com acesso às registries npm internas/externas.

## Setup
```sh
~/.bun/bin/bun install
```
> Em ambientes sem acesso à internet, o comando acima falha ao resolver dependências (ex.: `ink`). Configure mirror interno ou baixe os pacotes previamente.

## Scripts
- `bun run src/index.ts`: executa o TUI stub (Ink).
- `bun run dev`: alias para desenvolvimento (Ink).
- `bun run dev:blessed`: preview visual com NeoBlessed (layout mais próximo de dashboard).

## Atalhos NeoBlessed
- `g` modo guided (com gates)
- `e` modo expert (atalho)
- `r` refresh de workflows/sessões
- `i` importa evidência de sessão expert concluída para sessão guided da mesma fase
- `Enter` inicia workflow selecionado

## Próximos passos
1. Adicionar lint/test (ex.: Biome/ESLint).
2. Estruturar componentes TUI (sidebar, log pane, prompt).
3. Implementar client de configuração (`config.env` + storage XDG).
