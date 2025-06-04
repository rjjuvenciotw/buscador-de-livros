/**
 * gemini.js - Integração com a API do Gemini (Google AI)
 * Utilizado para gerar descrições aprimoradas e análises de livros
 */

// Configuração da API do Gemini
const CONFIGURACAO_GEMINI = {
    chaveApi: "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg", // Substitua com sua chave API real
    urlApi: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    maxTentativas: 2,
    tempoLimite: 10000  // 10 segundos
};

// Expor a API globalmente
window.ApiGemini = {
    inicializar: inicializarApiGemini,
    obterDescricaoLivro: gerarDescricaoLivroParaInterface,
    obterDescricaoBusca: generateSearchDescription,
    obterRecomendacoes: generateRecommendations,
    analisarLivro: analyzeBook,
    obterDescricao: gerarDescricaoLivroParaInterface
};

/**
 * Inicializa a API do Gemini com a chave fornecida
 * @param {string} chaveApiRecebida - Chave de API do Gemini
 */
function inicializarApiGemini(chaveApiRecebida) {
    if (chaveApiRecebida && chaveApiRecebida.length > 10) {
        CONFIGURACAO_GEMINI.chaveApi = chaveApiRecebida;
        console.log("API Gemini inicializada com sucesso");
        return true;
    }
    console.warn("Chave API inválida. Utilizando chave padrão ou modo demonstração.");
    return CONFIGURACAO_GEMINI.chaveApi !== "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg";
}

/**
 * Gera uma descrição aprimorada para um livro usando IA
 * @param {Object} dadosLivro - Objeto com informações do livro
 * @returns {Promise<string>} - Descrição gerada pela IA
 */
async function gerarDescricaoLivroComGemini(dadosLivro) {
    if (CONFIGURACAO_GEMINI.chaveApi === "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg") {
        console.warn("Usando descrição alternativa pois a chave da API Gemini não foi configurada.");
        return gerarDescricaoAlternativa(dadosLivro);
    }
    
    try {
        const instrucao = construirInstrucaoLivro(dadosLivro);
        const dadosRequisicao = {
            contents: [{ parts: [{ text: instrucao }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300,
                topP: 0.9,
                topK: 40
            }
        };
        
        const resposta = await fetch(`${CONFIGURACAO_GEMINI.urlApi}?key=${CONFIGURACAO_GEMINI.chaveApi}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosRequisicao),
            signal: AbortSignal.timeout(CONFIGURACAO_GEMINI.tempoLimite)
        });
        
        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            throw new Error(`Erro na API do Gemini: ${resposta.status} - ${erroTexto}`);
        }
        
        const dadosResposta = await resposta.json();
        
        if (dadosResposta.candidates && dadosResposta.candidates.length > 0 && 
            dadosResposta.candidates[0].content && 
            dadosResposta.candidates[0].content.parts && 
            dadosResposta.candidates[0].content.parts.length > 0) {
            
            return dadosResposta.candidates[0].content.parts[0].text.trim();
        } else {
            console.warn("Formato de resposta inesperado da API Gemini:", dadosResposta);
            throw new Error("Formato de resposta inesperado da API Gemini");
        }
    } catch (erro) {
        console.error("Erro ao gerar descrição com Gemini:", erro);
        return gerarDescricaoAlternativa(dadosLivro);
    }
}

/**
 * Constrói um prompt adequado para enviar ao Gemini com base nas informações do livro
 * @param {Object} dadosLivro - Objeto com informações do livro
 * @returns {string} - Prompt formatado
 */
function construirInstrucaoLivro(dadosLivro) {
    let instrucao = `RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL. Gere uma descrição curta e envolvente (idealmente 1-2 frases, máximo de 250 caracteres) para o livro abaixo. Evite frases como "Este livro é sobre..." ou "A descrição do livro é...". Vá direto ao ponto.\n\n`;
    instrucao += `Título: ${dadosLivro.title}\n`;
    if (dadosLivro.authors && dadosLivro.authors.length > 0) {
        instrucao += `Autor(es): ${dadosLivro.authors.join(', ')}\n`;
    }
    if (dadosLivro.publishedDate) {
        instrucao += `Ano de publicação: ${dadosLivro.publishedDate}\n`;
    }
    if (dadosLivro.categories && dadosLivro.categories.length > 0) {
        instrucao += `Categorias: ${dadosLivro.categories.join(', ')}\n`;
    }
    // Apenas incluir descrição original se for útil e não redundante
    if (dadosLivro.description && dadosLivro.description.length > 10 && 
        dadosLivro.description !== 'Sem descrição disponível' && 
        dadosLivro.description.toLowerCase().indexOf('não disponível') === -1) {
        instrucao += `Trecho da descrição original: ${dadosLivro.description.substring(0,100)}...\n`;
    }
    instrucao += `\nSeja direto e use uma linguagem que desperte curiosidade.`;
    return instrucao;
}

/**
 * Gera descrição a partir do termo de busca
 * @param {string} termoBusca - Termo de busca do usuário
 * @returns {Promise<string>} - Descrição gerada pela IA
 */
async function gerarDescricaoBuscaComGemini(termoBusca) {
    if (CONFIGURACAO_GEMINI.chaveApi === "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg") {
        return `Resultados da busca por "${termoBusca}"`;
    }
    
    try {
        const instrucao = `RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL. Crie um título ou uma frase curta e chamativa (máximo 2 frases) para uma seção de resultados de busca sobre "${termoBusca}". Seja criativo e direto. Não use introduções como "Aqui estão os resultados para...". Exemplo: "Explorando o universo de ${termoBusca}" ou "O que encontramos sobre ${termoBusca}:".`;
        const dadosRequisicao = {
            contents: [{ parts: [{ text: instrucao }] }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 150,
                topP: 0.9,
                topK: 40
            }
        };
        
        const resposta = await fetch(`${CONFIGURACAO_GEMINI.urlApi}?key=${CONFIGURACAO_GEMINI.chaveApi}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosRequisicao),
            signal: AbortSignal.timeout(CONFIGURACAO_GEMINI.tempoLimite)
        });
        
        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            throw new Error(`Erro na API do Gemini ao gerar descrição da busca: ${resposta.status} - ${erroTexto}`);
        }
        
        const dadosResposta = await resposta.json();
        if (dadosResposta.candidates && dadosResposta.candidates[0]?.content?.parts?.[0]?.text) {
            return dadosResposta.candidates[0].content.parts[0].text.trim();
        } else {
            console.warn("Formato de resposta inesperado da API Gemini para descrição de busca:", dadosResposta);
            throw new Error("Formato de resposta inesperado da API Gemini para descrição de busca");
        }
    } catch (erro) {
        console.error("Erro ao gerar descrição da busca com Gemini:", erro);
        return `Resultados para "${termoBusca}"`;
    }
}

/**
 * Gera recomendações de livros com base em histórico e favoritos
 * @param {Array} livrosFavoritos - Lista de livros favoritos
 * @param {Array} historicoBusca - Histórico de pesquisas
 * @returns {Promise<Array>} - Array com recomendações geradas
 */
async function gerarRecomendacoesComGemini(livrosFavoritos = [], historicoBusca = []) {
    if (CONFIGURACAO_GEMINI.chaveApi === "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg") {
        return gerarRecomendacoesPadrao();
    }
    
    try {
        let instrucao = `RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL. Gere 3 recomendações de livros baseadas nos seguintes dados:\n\n`;
        if (livrosFavoritos && livrosFavoritos.length > 0) {
            instrucao += "Livros favoritos do usuário:\n";
            livrosFavoritos.slice(0, 3).forEach((livro, indice) => {
                instrucao += `${indice + 1}. "${livro.title}"${livro.authors ? ` por ${livro.authors.join(', ')}` : ''}`;
                if (livro.categories && livro.categories.length > 0) {
                    instrucao += `   Categorias: ${livro.categories.join(', ')}`;
                }
                instrucao += "\n";
            });
            instrucao += "\n";
        }
        if (historicoBusca && historicoBusca.length > 0) {
            instrucao += "Termos de busca recentes do usuário:\n";
            historicoBusca.slice(0, 5).forEach((termo, indice) => {
                instrucao += `${indice + 1}. "${termo}"\n`;
            });
            instrucao += "\n";
        }
        if (livrosFavoritos.length === 0 && historicoBusca.length === 0) {
            instrucao += "O usuário não forneceu favoritos ou histórico de busca. Sugira 3 livros populares e aclamados pela crítica de gêneros variados (Ex: um romance, uma ficção científica, um não-ficção).\n";
        }
        instrucao += `Baseado nas informações (ou na falta delas, sugira obras gerais), sugira 3 livros. Formate a resposta como uma lista JSON de objetos. Cada objeto deve ter as chaves: "titulo", "autor", "ano" (apenas o ano), "urlImagem" (use uma URL de placeholder como 'img/placeholder.png' se não tiver uma real), e "categoria" (gênero principal). Não inclua nenhum texto explicativo, apenas o array JSON. Exemplo de um item: {"titulo": "O Nome do Vento", "autor": "Patrick Rothfuss", "ano": "2007", "urlImagem": "img/placeholder.png", "categoria": "Fantasia"}.`;
        
        const dadosRequisicao = {
            contents: [{ parts: [{ text: instrucao }] }],
            generationConfig: {
                temperature: 0.8, 
                maxOutputTokens: 1000, 
                topP: 0.9, 
                topK: 40,
                // Garantir que a resposta seja JSON
                response_mime_type: "application/json", // Para modelos que suportam saída JSON diretamente
            }
        };
        
        const resposta = await fetch(`${CONFIGURACAO_GEMINI.urlApi}?key=${CONFIGURACAO_GEMINI.chaveApi}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosRequisicao),
            signal: AbortSignal.timeout(CONFIGURACAO_GEMINI.tempoLimite)
        });

        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            throw new Error(`Erro na API do Gemini ao gerar recomendações: ${resposta.status} - ${erroTexto}`);
        }
        
        const textoResposta = await resposta.text();
        return analisarRespostaRecomendacao(textoResposta);

    } catch (erro) {
        console.error("Erro ao gerar recomendações com Gemini:", erro);
        return gerarRecomendacoesPadrao();
    }
}

/**
 * Analisa a resposta de recomendação da API
 * @param {string} textoResposta - Texto da resposta da API
 * @returns {Array} - Array de livros recomendados
 */
function analisarRespostaRecomendacao(textoResposta) {
    try {
        // Gemini pode retornar o JSON diretamente ou dentro de um bloco de código markdown
        const jsonMatch = textoResposta.match(/```json\n([\s\S]*?)\n```/);
        let jsonString = textoResposta;
        if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
        }
        
        const recomendacoes = JSON.parse(jsonString);
        if (Array.isArray(recomendacoes)) {
            // Validar estrutura básica
            return recomendacoes.filter(rec => rec.titulo && rec.autor).map(rec => ({
                title: rec.titulo,
                authors: [rec.autor].flat(), // Garante que seja um array
                publishedDate: rec.ano || 'N/A',
                imageLinks: { thumbnail: rec.urlImagem || 'img/placeholder.png' },
                categories: rec.categoria ? [rec.categoria] : ['Recomendação Geral'],
                isRecommendation: true // Flag para identificar no UI
            }));
        }
        console.warn("Resposta de recomendação não é um array JSON válido:", textoResposta);
        return gerarRecomendacoesPadrao();
    } catch (erro) {
        console.error("Erro ao analisar resposta de recomendação do Gemini:", erro, "Resposta recebida:", textoResposta);
        return gerarRecomendacoesPadrao(); // Fallback em caso de erro de parse
    }
}

/**
 * Gera recomendações padrão caso a API falhe
 * @returns {Array} - Lista de recomendações padrão
 */
function gerarRecomendacoesPadrao() {
    console.log("Gerando recomendações padrão.");
    return [
        {
            title: "Dom Casmurro",
            authors: ["Machado de Assis"],
            publishedDate: "1899",
            imageLinks: { thumbnail: "img/domcasmurro_placeholder.jpg" }, // Exemplo de placeholder
            categories: ["Romance", "Literatura Brasileira"],
            description: "Um clássico da literatura brasileira que explora temas de ciúme e dúvida.",
            isRecommendation: true
        },
        {
            title: "O Guia do Mochileiro das Galáxias",
            authors: ["Douglas Adams"],
            publishedDate: "1979",
            imageLinks: { thumbnail: "img/guia_placeholder.jpg" },
            categories: ["Ficção Científica", "Humor"],
            description: "Uma aventura cômica e absurda pelo espaço.",
            isRecommendation: true
        },
        {
            title: "Sapiens: Uma Breve História da Humanidade",
            authors: ["Yuval Noah Harari"],
            publishedDate: "2011",
            imageLinks: { thumbnail: "img/sapiens_placeholder.jpg" },
            categories: ["Não-ficção", "História"],
            description: "Uma exploração fascinante da história da nossa espécie.",
            isRecommendation: true
        }
    ];
}

/**
 * Gera uma descrição alternativa quando a API falha ou não está configurada
 * @param {Object} dadosLivro - Objeto com informações do livro
 * @returns {string} - Descrição alternativa
 */
function gerarDescricaoAlternativa(dadosLivro) {
    if (dadosLivro && dadosLivro.description && dadosLivro.description.length > 20) {
        return dadosLivro.description.substring(0, 200) + (dadosLivro.description.length > 200 ? "..." : "");
    }
    let altDesc = `Informações sobre "${dadosLivro.title || 'este livro'}"`;
    if (dadosLivro.authors && dadosLivro.authors.length > 0) {
        altDesc += ` por ${dadosLivro.authors.join(', ')}`;
    }
    altDesc += ". Mais detalhes podem estar disponíveis na página do livro.";
    return altDesc;
}

/**
 * Analisa um livro e retorna insights sobre ele
 * @param {Object} dadosLivro - Objeto com informações do livro
 * @returns {Promise<Object>} - Objeto com análise do livro
 */
async function analisarLivroComGemini(dadosLivro) {
    if (CONFIGURACAO_GEMINI.chaveApi === "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg") {
        return {
            audience: obterPublicoRecomendado(dadosLivro),
            complexity: estimarComplexidade(dadosLivro),
            summary: "Análise detalhada indisponível sem chave de API configurada.",
            error: "Chave de API não configurada"
        };
    }

    try {
        const instrucao = `RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL. Analise o livro "${dadosLivro.title}"${dadosLivro.authors ? ` por ${dadosLivro.authors.join(', ')}` : ''}. Forneça:\n1.  Um resumo conciso (2-3 frases).\n2.  O público-alvo principal (ex: Jovens Adultos, Acadêmicos, Leitores Casuais, etc.).\n3.  Uma estimativa do nível de complexidade da leitura (ex: Fácil, Moderado, Desafiador).\n\nFormate a resposta como um objeto JSON com as chaves "resumo", "publicoAlvo", "complexidadeLeitura".\nExemplo: {"resumo": "...", "publicoAlvo": "Jovens Adultos", "complexidadeLeitura": "Moderado"}`; 
        
        const dadosRequisicao = {
            contents: [{ parts: [{ text: instrucao }] }],
            generationConfig: { 
                temperature: 0.6, 
                maxOutputTokens: 500,
                response_mime_type: "application/json",
            }
        };

        const resposta = await fetch(`${CONFIGURACAO_GEMINI.urlApi}?key=${CONFIGURACAO_GEMINI.chaveApi}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosRequisicao),
            signal: AbortSignal.timeout(CONFIGURACAO_GEMINI.tempoLimite)
        });

        if (!resposta.ok) {
            const erroTexto = await resposta.text();
            throw new Error(`Erro na API Gemini ao analisar livro: ${resposta.status} - ${erroTexto}`);
        }

        const textoResposta = await resposta.text();
        // Gemini pode retornar o JSON diretamente ou dentro de um bloco de código markdown
        const jsonMatch = textoResposta.match(/```json\n([\s\S]*?)\n```/);
        let jsonString = textoResposta;
        if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
        }

        const analise = JSON.parse(jsonString);
        return {
            summary: analise.resumo || "Resumo não pôde ser gerado.",
            audience: analise.publicoAlvo || obterPublicoRecomendado(dadosLivro),
            complexity: analise.complexidadeLeitura || estimarComplexidade(dadosLivro)
        };

    } catch (erro) {
        console.error("Erro ao analisar livro com Gemini:", erro);
        return {
            audience: obterPublicoRecomendado(dadosLivro),
            complexity: estimarComplexidade(dadosLivro),
            summary: "Erro ao gerar análise detalhada com IA.",
            error: erro.message
        };
    }
}

/**
 * Funções de fallback para análise quando a API não está disponível
 */
function obterPublicoRecomendado(dadosLivro) {
    if (dadosLivro.categories) {
        const categorias = dadosLivro.categories.join(' ').toLowerCase();
        if (categorias.includes('juvenil') || categorias.includes('young adult')) return "Jovens Adultos";
        if (categorias.includes('infantil') || categorias.includes('children')) return "Infantil";
        if (categorias.includes('ficção científica') || categorias.includes('fantasia')) return "Fãs de Ficção/Fantasia";
        if (categorias.includes('negócios') || categorias.includes('economia')) return "Profissionais e Estudantes de Negócios";
        if (categorias.includes('história') || categorias.includes('biografia')) return "Interessados em História/Biografias";
    }
    return "Leitores em Geral";
}

function estimarComplexidade(dadosLivro) {
    if (dadosLivro.pageCount > 400) return "Leitura Extensa/Desafiadora";
    if (dadosLivro.categories && dadosLivro.categories.join(' ').toLowerCase().includes('acadêmico')) return "Acadêmico/Complexo";
    if (dadosLivro.pageCount < 150) return "Leitura Rápida/Fácil";
    return "Moderada";
}

// Funções expostas pela Interface da API (wrappers para as funções internas com tratamento de erro)

async function gerarDescricaoLivroParaInterface(livro) {
    try {
        return await gerarDescricaoLivroComGemini(livro);
    } catch (erro) {
        console.error("[ApiGemini.obterDescricaoLivro] Erro:", erro);
        return gerarDescricaoAlternativa(livro); // Fallback final
    }
}

async function gerarDescricaoBuscaParaInterface(termoBusca) {
    try {
        return await gerarDescricaoBuscaComGemini(termoBusca);
    } catch (erro) {
        console.error("[ApiGemini.obterDescricaoBusca] Erro:", erro);
        return `Resultados para "${termoBusca}"`; // Fallback final
    }
}

async function gerarRecomendacoesParaInterface(livrosFavoritos = [], historicoBusca = []) {
    try {
        return await gerarRecomendacoesComGemini(livrosFavoritos, historicoBusca);
    } catch (erro) {
        console.error("[ApiGemini.obterRecomendacoes] Erro:", erro);
        return gerarRecomendacoesPadrao(); // Fallback final
    }
}

async function analisarLivroParaInterface(livro) {
    try {
        return await analisarLivroComGemini(livro);
    } catch (erro) {
        console.error("[ApiGemini.analisarLivro] Erro:", erro);
        return { 
            summary: "Análise indisponível no momento.", 
            audience: obterPublicoRecomendado(livro), 
            complexity: estimarComplexidade(livro),
            error: "Erro ao processar análise."
        };
    }
}

// Garantir que StorageManager seja acessível se definido em outro script.
// Esta verificação é apenas um exemplo, StorageManager deve ser carregado antes.
if (typeof StorageManager === 'undefined') {
    console.warn('StorageManager não definido. Funcionalidades de histórico e API Key podem não funcionar como esperado.');
} 
