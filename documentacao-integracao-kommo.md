# 📘 Documentação da Integração Kommo CRM → Planilha (Google Apps Script)

Documento de referência técnica para mapeamento de IDs do Kommo CRM, estrutura da planilha (Aba "Vendas") e regras de negócio da integração no Código.gs.

---

## 🔗 Endpoint do Webhook Active

- **URL de Produção**: `https://script.google.com/macros/s/AKfycbxeb9odLituSVzXRT3IO2REvi9xPxICXwVRSA-Y1FHrtFoPv3Y4uoTQ3k-1uEJ8yNYX0A/exec`
- **Método**: `POST` (`action=kommo_add` ou disparo direto de webhook do Kommo)

---

## 🆔 IDs dos Funis no Kommo

| Funil | Pipeline ID | Descrição |
|-------|------------|-----------|
| **Funil 1 — Consulta** | `12121252` | Vendas e agendamentos de consultas médicas |
| **Funil 2 — Procedimento** | `12197743` | Vendas de procedimentos estéticos / cirúrgicos |

---

## 📋 Tabela de IDs dos Campos Personalizados (Custom Fields)

### Campos do Lead

| Campo | ID no Kommo | Tipo no Kommo | Descrição / Uso |
|-------|-------------|---------------|-----------------|
| **Data Venda Consulta** | `3041602` | `date` | Data em que a consulta foi vendida (preenche Coluna A no Funil 1) |
| **Data Venda Procedimento** | `3026776` | `date` | Data em que o procedimento foi vendido (preenche Coluna A no Funil 2) |
| **Status da Consulta** | `3026774` | `select/text` | Status da consulta (ex: *Agendado*, *Realizado*) (Coluna K no Funil 1) |
| **Status do Procedimento** | `3041658` | `select/text` | Status do procedimento (ex: *A Agendar*, *Realizado*) (Coluna K no Funil 2) |
| **Tipo de Venda** | `3026838` | `select/text` | Identifica se é *Consulta* ou *Procedimento* (Coluna E) |
| **Data em que virou Lead** | `3026766` | `date` | Data do primeiro contato do lead (Coluna G) |
| **Vendedora** | `2985390` | `select/text` | Nome da vendedora responsável (Coluna H) |
| **Detalhe Procedimento** | `3026772` | `text` | Nome do procedimento vendido (ex: *Lipo HD*) (Coluna I) |
| **Local / Unidade** | `2268670` | `select/text` | Unidade da clínica (ex: *Barra da Tijuca*, *Cabo Frio*) (Coluna J) |
| **Data da Consulta** | `3024521` | `date` | Data agendada da consulta (Coluna M) |
| **Gênero / Sexo** | `2991328` | `select/text` | *Homem* ou *Mulher* (Coluna N) |
| **Origem** | `3026840` | `select/text` | Origem da venda (ex: *Tráfego Pago*, *Organico*, *Indicação*) (Coluna C) |

### Campos de Tags / Campanhas (Varredura na Coluna D)

O código faz uma varredura na ordem dos seguintes IDs até encontrar o primeiro valor preenchido:

```javascript
[3012582, 3012590, 3012614, 3012616, 3012702, 3012706, 3022140, 2998385, 2994630, 2991348, 2990854]
```

### Campos do Contato (Vinculado ao Lead)

| Campo | Código / ID | Descrição |
|-------|-------------|-----------|
| **Telefone** | Code `PHONE` ou ID `2985382` | Telefone do cliente (Coluna P) |
| **E-mail** | Code `EMAIL` ou ID `2985384` | E-mail do cliente (Coluna O) |

---

## 📊 Mapeamento de Colunas — Aba "Vendas"

| Coluna | Nome da Coluna | Origem dos Dados no Kommo | Fallback (se estiver em branco) |
|:------:|----------------|---------------------------|----------------------------------|
| **A** | Data Venda | `3041602` (Funil 1) ou `3026776` (Funil 2) | Data de Hoje (`yyyy-MM-dd`) |
| **B** | Cliente | Nome do Lead (`lead.name`) | `"Sem Nome"` |
| **C** | Origem | Campo `3026840` | `"Tráfego Pago"` |
| **D** | Tag | Lista de IDs de Tags | `"ORGÂNICO"` |
| **E** | Tipo | Campo `3026838` | `"Consulta"` (Funil 1) ou `"Procedimento"` (Funil 2) |
| **F** | Valor | Preço do Lead (`lead.price`) | `0` |
| **G** | Data Lead | Campo `3026766` | Data de Hoje (`yyyy-MM-dd`) |
| **H** | Vendedora | Campo `2985390` | `"Amanda"` |
| **I** | Detalhe Procedimento | Campo `3026772` | `""` (vazio) |
| **J** | Local | Campo `2268670` | `"Cabo Frio"` |
| **K** | Status | `3026774` (Funil 1) ou `3041658` (Funil 2) | `"Agendado"` |
| **L** | *(Reservado)* | Preservado para uso existente | `""` (vazio) |
| **M** | Data Consulta | Campo `3024521` | `""` (vazio) |
| **N** | Gênero | Campo `2991328` | `"Mulher"` |
| **O** | E-mail | E-mail do Contato vinculado | `""` (vazio) |
| **P** | Telefone | Telefone do Contato vinculado | `""` (vazio) |
| **Q** | *(Reservado)* | Vazio | `""` (vazio) |
| **R** | *(Reservado)* | Vazio | `""` (vazio) |
| **S** | Chave Dedup | Gerado automaticamente: `leadId_Tipo_DataVenda` | Usado para trava anti-duplicação |

---

## 🧠 Lógica de Negócio e Anti-Duplicação

### 1. Detecção Automática do Funil
Quando o Kommo envia o webhook, o script faz `GET /api/v4/leads/{leadId}` e lê `lead.pipeline_id`:
- Se `pipeline_id == 12121252` → Ativa modo **Consulta** (usa `3041602` para Data e `3026774` para Status).
- Se `pipeline_id == 12197743` → Ativa modo **Procedimento** (usa `3026776` para Data e `3041658` para Status).

### 2. Dupla Trava Anti-Duplicação
1. **1ª Camada — Cache em Memória (30 segundos)**:
   - Bloqueia envios paralelos simultâneos do Kommo disparados no mesmo segundo.
   - Chave do Cache: `KOMMO_ADD_{leadId}_{pipelineId}`.
2. **2ª Camada — Leitura Otimizada da Planilha (Coluna S)**:
   - Lê apenas as **últimas 20 linhas da coluna S** para checar se a chave `leadId_Tipo_DataVenda` já foi gravada.
   - Evita retries do Kommo sem ralentizar a execução.
   - Permite que o mesmo lead compre mais de uma vez em datas diferentes ou compre Consulta + Procedimento.

### 3. Alta Performance (< 1 Segundo)
- O script executa em **sub-segundo (< 1s)** porque grava apenas **1 log de resumo no final** da aba DEBUG.
- Isso atende ao requisito de tempo do Kommo (< 2s), garantindo resposta HTTP 200 OK imediata e eliminando retries automáticos de 5/15 minutos.
