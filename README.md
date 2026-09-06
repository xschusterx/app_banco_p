# ARSENAL Save

Alterador de save para **A.R.S.E.N.A.L Extended Power** (Tactical Soft).

Edita cenário, nomes de comandantes, facções, cidades de QG e os **3 recursos** de cada jogador. O arquivo é um container com header próprio + payload zlib (`ARSENAL2.G`).

## Interface web

```bash
python3 -m http.server 8080
```

Abra `http://localhost:8080`, solte o save ou clique em **Abrir sample**.

## CLI

```bash
# Inspecionar
python3 tools/arsenal_save.py info samples/WorldWideWar.save

# Recursos máximos para todos
python3 tools/arsenal_save.py edit samples/WorldWideWar.save \
  -o /tmp/rich.save --set-resources 999999

# Renomear jogador 0
python3 tools/arsenal_save.py edit samples/WorldWideWar.save \
  -o /tmp/custom.save --player 0 --name "Seu Nome" --r1 500000
```

## Formato (resumo)

| Camada | Conteúdo |
|--------|----------|
| Outer | 11 bytes magic + `u32` tamanho descomprimido + `u32` tamanho zlib + stream zlib (level 6) |
| Inner | Magia `ARSENAL2.G`, cenário em `0x59` (30 bytes), blocos de jogador com facção/nome/3×`u32` recursos/cidade |

Sample incluso: `samples/WorldWideWar.save` (campanha *World Wide War*, 8 jogadores).
