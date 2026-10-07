# 📘 Planejamento Técnico: Nova Integração Kommo CRM (Leads Orgânicos & Rastreamento)

Documento de especificação técnica, regras de negócio e checklist operacional para implementação futura do rastreamento de **Leads Orgânicos (Instagram Bio, Indicações e WhatsApp Direto)** no Kommo CRM, Google Apps Script e Dashboard.

---

## 📌 1. Diagnóstico do Cenário Atual

Atualmente, o fluxo de dados possui a seguinte característica:

1. **Topo do Funil (Leads)**:
   * Alimentado exclusivamente pelos relatórios da **Meta Ads** (via Zernio API) e **Google Ads** na aba `Marketing`.
   * Considera apenas os cliques/leads originados de tráfego pago.
2. **Fundo do Funil (Vendas)**:
   * Alimentado pelo Webhook do Kommo (`Código.gs`) apenas no fechamento de **Consulta** (Pipeline `12121252`) ou **Procedimento** (Pipeline `12197743`).
   * Fallback atual no script: se o campo de Origem do lead estiver vazio no Kommo, a linha é gravada por padrão como `"Tráfego Pago"` (Coluna C).
3. **Ponto Cego de Negócio**:
   * Centenas de contatos chegam ao WhatsApp por vias orgânicas (link da bio do Instagram, indicação de pacientes, busca orgânica no Google).
   * Esses leads **não são contabilizados no topo do funil** (não sabemos a taxa de atração real).
   * Quando compram, correm o risco de ser atribuídos falsamente a Tráfego Pago se a vendedora não preencher manualmente a origem.

---

## 🔍 2. Padrão Identificado: Link da Bio do Instagram

Já existe um rastreamento implementado no link da bio do Instagram que preenche a primeira mensagem do WhatsApp:

> **Exemplo Real:**  
> `(Ref: ig-link_in_bio) Olá, gostaria de saber mais sobre a consulta em Cabo Frio com o Dr. Natalino Mazzillo.`

A presença da tag literal `(Ref: ig-link_in_bio)` no texto inicial da conversa permite **100% de automação no Kommo**, sem intervenção humana.

---

## 🛠️ 3. O que precisa ser feito no Kommo CRM

### 3.1. Automação do Link da Bio (Gatilho / Salesbot)
No pipeline de entrada do Kommo (Leads de Entrada / Primeiro Contato):
* **Condição de Disparo**:
  * Mensagem recebida contém o texto `(Ref: ig-link_in_bio)` ou `ig-link_in_bio`.
* **Ações Automáticas**:
  1. **Preencher Campo Origem (`ID: 3026840`)**: Definir como `"Orgânico"` (ou `"Instagram Orgânico"`).
  2. **Preencher Campo Tag / Campanha (`ID: 3012582`)**: Inserir `"ig-link_in_bio"`.
  3. **Adicionar Tag do Lead**: Adicionar a tag `#organico` e `#link-da-bio`.

### 3.2. Fluxo para Indicações e Contatos Diretos
Para pessoas que chamam por telefone passado por amigos ou conhecidos:
* **Opção A (Menu Automático no Salesbot)**:
  * Resposta de boas-vindas com botões de triagem:
    * `[1] Vim pelo Instagram` ➔ Aplica Tag `#organico-instagram`
    * `[2] Indicação de Amigo/Familiar` ➔ Aplica Tag `#indicacao`
    * `[3] Anúncio` ➔ Mantém fluxo de anúncio
* **Opção B (Operacional da Recepção/Comercial)**:
  * Treinamento para marcar o campo `Origem` como `"Indicação"` e preencher o nome do paciente indicador no card.

---

## ⚙️ 4. Integração no Google Apps Script (`Código.gs`)

### 4.1. Ajuste no Webhook de Vendas Atuais
No processamento de fechamento (`processKommoWebhook`):
* **Remover o fallback cego para "Tráfego Pago"**:
  ```javascript
  // Lógica inteligente de Origem
  let origemVal = getCF(ID_ORIGEM);
  if (!origemVal) {
    if (valorTagEncontrado && valorTagEncontrado.includes("ig-link_in_bio")) {
      origemVal = "Orgânico";
    } else {
      origemVal = "Tráfego Pago"; // fallback mantido apenas se não houver indício de orgânico
    }
  }
  ```

### 4.2. Medição do Volume Total de Leads Orgânicos (Topo do Funil)
Para que o dashboard saiba quantos leads orgânicos entraram por dia/mês:

* **Estratégia Recomendada: Ingestão de Canal Orgânico na Aba `Marketing`**:
  * Criar na aba `Marketing` registros diários com:
    * `platform`: `"Orgânico (Instagram / Indicação)"`
    * `spend`: `0` (custo direto zero)
    * `leads`: quantidade real de leads captados no dia
    * `campaignName`: `"Instagram Bio"` ou `"Indicação"`
  * **Como alimentar esses dados**:
    * **Opção 1 (Webhook no Kommo)**: Disparar webhook para o Apps Script no evento de novo lead criado com tag orgânica.
    * **Opção 2 (Cron Noturno via API do Kommo)**: Script diário executado às 23h59 que faz `GET /api/v4/leads` filtrando pela data de criação e soma quantos contatos orgânicos entraram no dia.

---

## 📊 5. Exibição no Dashboard

Com os dados de leads orgânicos registrados, o dashboard ganha:

1. **Separação no Topo do Funil**:
   * `Leads Totais: 950`
   * `• 917 Tráfego Pago (CPL R$ 29,72)`
   * `• 33 Orgânicos (Custo R$ 0,00)`
2. **Comparativo de Taxas de Conversão**:
   * Taxa de Conversão de Tráfego Pago: `Leads Pagos ➔ Vendas Pagas`.
   * Taxa de Conversão Orgânica: `Leads Orgânicos ➔ Vendas Orgânicas`.
3. **CAC e ROAS Reais**:
   * Visão do ROAS "Blended" (misturado) vs. ROAS "Pago Estrito", demonstrando o impacto real do posicionamento de marca do Dr. Natalino.

---

## ✅ 6. Checklist de Execução (Para quando for iniciar)

- [ ] **Etapa 1: Kommo CRM**
  - [ ] Acessar configurações de pipeline do Kommo.
  - [ ] Criar gatilho no Salesbot para detectar `(Ref: ig-link_in_bio)` no primeiro contato.
  - [ ] Configurar ação para setar Campo `Origem` = `Orgânico` e Tag = `ig-link_in_bio`.
  - [ ] Testar enviando mensagem teste pelo link da bio.
- [ ] **Etapa 2: Google Apps Script**
  - [ ] Ajustar lógica de fallback de Origem no `Código.gs`.
  - [ ] Criar rotina de contabilização diária de novos leads orgânicos.
- [ ] **Etapa 3: Dashboard React**
  - [ ] Incluir seletor ou quebra de leads Pagos vs. Orgânicos nos cards de funil.
  - [ ] Validar filtros por Origem na tela de Resultados.
