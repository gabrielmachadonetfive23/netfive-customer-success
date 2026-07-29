export const NEWS_CATEGORIES = ["segmento", "seguranca"] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

/**
 * Segmentos de clientes ativos na carteira Netfive, cada um com termos que
 * identificam uma notícia relacionada. Mantido manualmente — se novos
 * segmentos passarem a existir na carteira, adicionar aqui.
 */
export const SEGMENT_KEYWORDS: Readonly<Record<string, string[]>> = {
  "Manufatura/Indústria": ["indústria", "industrial", "manufatura", "fábrica", "linha de produção", "chão de fábrica", "planta industrial"],
  Energia: ["energia elétrica", "petróleo", "gás natural", "usina", "energia renovável", "energia solar", "energia eólica", "biogás", "biocombustível", "hidrelétrica"],
  "Financeiro/Bancário": ["banco", "bancário", "bancária", "fintech", "instituição financeira", "cooperativa financeira", "banco central", "selic"],
  Farmacêutico: ["farmacêutica", "farmacêutico", "medicamento", "indústria farmacêutica", "anvisa", "biotecnologia"],
  Agronegócio: ["agronegócio", "agro ", "commodities agrícolas", "soja", "milho", "grãos", "safra", "fertilizante", "maquinário agrícola", "agricultura"],
  Varejo: ["varejo", "varejista", "e-commerce", "consumo", "shopping center"],
  "Cooperativa de Crédito": ["cooperativa de crédito", "cooperativismo financeiro", "cooperativa financeira", "sistema de cooperativas de crédito"],
  Imobiliário: ["imobiliário", "construção civil", "incorporadora", "mercado imobiliário"],
  "Governo/Setor Público": ["governo", "setor público", "administração pública", "licitação", "prefeitura", "estatal"],
  Alimentício: ["indústria de alimentos", "alimentício", "bebidas", "food service"],
  Tecnologia: ["tecnologia", "software", "startup", "inteligência artificial", "cloud", "computação em nuvem"],
  Têxtil: ["têxtil", "confecção", "vestuário"],
  "Associação/Federação": ["associação empresarial", "federação", "sindicato patronal", "confederação"],
  "Logística/Transporte": ["logística", "transporte de cargas", "frota", "transportadora", "rodoviário"],
  Educação: ["educação", "ensino superior", "universidade", "faculdade"],
  Saúde: ["saúde", "hospital", "plano de saúde", "clínica", "healthtech"],
  "Comércio Atacadista (Borracha/Polímeros)": ["borracha", "polímero", "petroquímico", "plástico industrial"],
};

/** Marca a notícia como relevante para negócio (financeiro/tecnologia/investimento/modernização). */
const BUSINESS_KEYWORDS: readonly string[] = [
  "investimento",
  "investimentos",
  "investir",
  "modernização",
  "modernizar",
  "aquisição",
  "fusão",
  "expansão",
  "receita",
  "faturamento",
  "lucro",
  "balanço",
  "resultado financeiro",
  "capex",
  "nova fábrica",
  "nova planta",
  "compra de máquinas",
  "maquinário",
  "digitalização",
  "automação",
  "transformação digital",
  "joint venture",
  "ipo",
  "mercado financeiro",
  "crédito",
  "financiamento",
  "exportação",
  "importação",
  "tecnologia",
];

/** Marca a notícia como relevante para segurança da informação. */
const SECURITY_KEYWORDS: readonly string[] = [
  "phishing",
  "ransomware",
  "malware",
  "vazamento de dados",
  "vazamento de senhas",
  "ciberataque",
  "cibersegurança",
  "vulnerabilidade",
  "exploit",
  "golpe digital",
  "fraude digital",
  "engenharia social",
  "backdoor",
  "ataque hacker",
  "hackers",
  "violação de dados",
  "data breach",
  "zero-day",
  "botnet",
  "ddos",
  "spyware",
  "trojan",
  "sequestro de dados",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function findMatches(haystack: string, needles: readonly string[]): string[] {
  return needles.filter((needle) => haystack.includes(normalize(needle)));
}

/** Nomes de segmentos usados no filtro da página de Notícias. */
export const KNOWN_NEWS_SEGMENTS: readonly string[] = Object.keys(SEGMENT_KEYWORDS);

export interface ClassificationResult {
  category: NewsCategory;
  segments: string[];
  tags: string[];
}

/**
 * Classifica uma notícia (título + resumo) como relevante ou não.
 * - "segmento": precisa casar com pelo menos 1 segmento de cliente E 1 termo de negócio.
 * - "seguranca": precisa casar com pelo menos 1 termo de segurança (sem exigir segmento) —
 *   ou, quando `trustAsSecurity` é true (fonte dedicada a segurança), é aceita
 *   direto pela curadoria da fonte, sem exigir o match.
 * Retorna null quando a notícia não é relevante o suficiente para nenhuma das duas.
 */
export function classifyArticle(title: string, summary: string, trustAsSecurity = false): ClassificationResult | null {
  const haystack = normalize(`${title} ${summary}`);

  const securityTags = findMatches(haystack, SECURITY_KEYWORDS);
  const matchedSegments = Object.entries(SEGMENT_KEYWORDS)
    .filter(([, keywords]) => findMatches(haystack, keywords).length > 0)
    .map(([segment]) => segment);

  if (securityTags.length > 0 || trustAsSecurity) {
    return { category: "seguranca", segments: matchedSegments, tags: securityTags };
  }

  const businessTags = findMatches(haystack, BUSINESS_KEYWORDS);
  if (matchedSegments.length > 0 && businessTags.length > 0) {
    return { category: "segmento", segments: matchedSegments, tags: businessTags };
  }

  return null;
}
