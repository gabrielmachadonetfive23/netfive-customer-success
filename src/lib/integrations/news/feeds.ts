export interface NewsFeedSource {
  name: string;
  url: string;
  /**
   * "security": fonte dedicada a segurança da informação — todo item é
   * confiado como categoria "seguranca" pela curadoria da própria fonte,
   * sem exigir match de palavra-chave (evita falso negativo por fraseado
   * diferente do dicionário). "business": passa pela classificação normal
   * (segmento+negócio OU segurança oportunista via palavra-chave).
   */
  kind: "business" | "security";
}

/**
 * Fontes oficiais e verificadas usadas na coleta diária de notícias.
 * Financeiro/tecnologia/negócios: dão insumo sobre os segmentos de clientes.
 * Segurança: CERTs oficiais e veículos de referência em cibersegurança.
 */
export const BUSINESS_NEWS_FEEDS: readonly NewsFeedSource[] = [
  { name: "G1 Economia", url: "https://g1.globo.com/rss/g1/economia/", kind: "business" },
  { name: "G1 Tecnologia", url: "https://g1.globo.com/rss/g1/tecnologia/", kind: "business" },
  { name: "InfoMoney", url: "https://www.infomoney.com.br/feed/", kind: "business" },
  { name: "CNN Brasil", url: "https://www.cnnbrasil.com.br/feed/", kind: "business" },
  { name: "Agência Brasil - Economia", url: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml", kind: "business" },
  { name: "CanalTech", url: "https://canaltech.com.br/rss/", kind: "business" },
];

export const SECURITY_NEWS_FEEDS: readonly NewsFeedSource[] = [
  { name: "CERT.br", url: "https://www.cert.br/rss/", kind: "security" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews", kind: "security" },
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/", kind: "security" },
];

export const ALL_NEWS_FEEDS: readonly NewsFeedSource[] = [...BUSINESS_NEWS_FEEDS, ...SECURITY_NEWS_FEEDS];
