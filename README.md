# ⚡ EletrApp Residencial

**Projeto Elétrico Residencial automatizado** – Dimensionamento completo conforme NBR 5410:2005 e padrão Cemig ND-5.5.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

---

## 🎯 O que o EletrApp faz

1. **Cadastro de cômodos** com dimensões reais
2. **Cálculo automático** de:
   - Iluminação (método dos lúmens)
   - Tomadas TUG (a cada 5m de perímetro)
   - Tomadas TUE (equipamentos específicos)
   - Demanda total (Cemig ND-5.5)
   - Bitola de condutores (Tabelas 36, 38, 40 NBR 5410)
   - Queda de tensão (máx. 4%)
   - Disjuntores e DRs
3. **Geração de documentos profissionais**:
   - 📄 Memorial descritivo
   - 📊 Memorial de cálculo
   - 🖼️ Planta elétrica (símbolos NBR 5444)
   - 📐 Diagrama unifilar
   - 📦 Lista de materiais
   - ✍️ Termo de responsabilidade/ART

---

## 🚀 Como executar

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Acessar no navegador
http://localhost:3000

app/
├── page.tsx          # Dados da obra
├── comodos/          # Cadastro de cômodos
├── calculos/         # Cálculos elétricos
├── planta/           # Planta elétrica (canvas)
├── unifilar/         # Diagrama unifilar
└── documentos/       # Geração de PDF
lib/
├── calculations.ts   # Fórmulas NBR 5410
├── constants.ts      # Tabelas (lúmens, TUGs, etc.)
└── store.ts          # Estado global (Zustand)

📚 Normas técnicas implementadas
NBR 5410:2005 – Instalações elétricas de baixa tensão

NBR 5444:1989 – Símbolos gráficos para plantas elétricas

ND-5.5 Cemig – Fornecimento de energia em tensão secundária

NBR ISO/CIE 8995-1 – Níveis de iluminância para interiores

🛠️ Tecnologias utilizadas
Next.js 16 (App Router)

TypeScript

TailwindCSS

jsPDF + jsPDF-autotable

Canvas API 2D (planta e unifilar)

Zustand (estado global)

👨‍💻 Autor
Roberto Souza – GitHub

Projeto desenvolvido com auxílio de IA (Claude), com revisões e adaptações manuais para atender às normas técnicas brasileiras.

⚠️ Aviso importante
Este projeto é uma ferramenta de auxílio ao dimensionamento e não substitui a análise crítica de um engenheiro eletricista habilitado. A emissão de ART é obrigatória conforme Lei 6.496/77.

📄 Licença
MIT – use à vontade, mas mantenha os créditos.