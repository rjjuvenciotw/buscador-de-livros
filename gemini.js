/**
 * gemini.js - Integração com a API do Gemini (Google AI)
 * Utilizado para gerar descrições aprimoradas e análises de livros
 */

// Configuração da API do Gemini
const GEMINI_CONFIG = {
    apiKey: "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg", // Substitua com sua chave API real
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    maxRetries: 2,
    timeout: 10000  // 10 segundos
};

// Expor a API globalmente
window.GeminiAPI = {
    init: initGemini,
    getBookDescription: generateBookDescription,
    getSearchDescription: generateSearchDescription,
    getRecommendations: generateRecommendations,
    analyzeBook: analyzeBook,
    getDescription: generateBookDescription // Alias para compatibilidade com código existente
};

/**
 * Inicializa a API do Gemini com a chave fornecida
 * @param {string} apiKey - Chave de API do Gemini
 */
function initGemini(apiKey) {
    if (apiKey && apiKey.length > 10) {
        GEMINI_CONFIG.apiKey = apiKey;
        console.log("API Gemini inicializada com sucesso");
        return true;
    }
    console.warn("Chave API inválida. Utilizando modo demonstração.");
    return false;
}

/**
 * Gera uma descrição aprimorada para um livro usando IA
 * @param {Object} book - Objeto com informações do livro
 * @returns {Promise<string>} - Descrição gerada pela IA
 */
async function generateBookDescription(book) {
    // Verificar se temos uma chave API configurada
    if (GEMINI_CONFIG.apiKey === "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg") {
        return generateFallbackDescription(book);
    }
    
    try {
        // Construir o prompt para o Gemini
        const prompt = buildBookPrompt(book);
        
        // Preparar a requisição
        const requestData = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300,
                topP: 0.9,
                topK: 40
            }
        };
        
        // Fazer a requisição à API
        const response = await fetch(`${GEMINI_CONFIG.apiUrl}?key=${GEMINI_CONFIG.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API do Gemini: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extrair o texto da resposta
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            return data.candidates[0].content.parts[0].text.trim();
        } else {
            throw new Error("Formato de resposta inesperado da API Gemini");
        }
    } catch (error) {
        console.error("Erro ao gerar descrição com Gemini:", error);
        return generateFallbackDescription(book);
    }
}

/**
 * Constrói um prompt adequado para enviar ao Gemini com base nas informações do livro
 * @param {Object} book - Objeto com informações do livro
 * @returns {string} - Prompt formatado
 */
function buildBookPrompt(book) {
    let prompt = `RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL,Gere uma descrição concisa e atraente (máximo 250 caracteres) para o seguinte livro. :\n\n`;
    prompt += `Título: ${book.title}\n`;
    prompt += `Autor(es): ${book.authors.join(', ')}\n`;
    
    if (book.publishedDate) {
        prompt += `Ano de publicação: ${book.publishedDate}\n`;
    }
    
    if (book.categories && book.categories.length > 0) {
        prompt += `Categorias: ${book.categories.join(', ')}\n`;
    }
    
    if (book.description && book.description !== 'Sem descrição disponível' && 
        book.description !== 'Descrição não disponível na API do Open Library') {
        prompt += `Descrição original: ${book.description}\n`;
    }
    
    prompt += `\nFormate a resposta como um único parágrafo breve que capture a essência do livro, sem introdução ou conclusão. Não mencione que você está descrevendo o livro, apenas forneça a descrição diretamente. RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL.`;
    
    return prompt;
}

/**
 * Gera descrição a partir do termo de busca
 * @param {string} searchTerm - Termo de busca do usuário
 * @returns {Promise<string>} - Descrição gerada pela IA
 */
async function generateSearchDescription(searchTerm) {
    // Verificar se temos uma chave API configurada
    if (GEMINI_CONFIG.apiKey === "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg") {
        return `Resultados para "${searchTerm}"`;
    }
    
    try {
        // Construir o prompt para o Gemini
        const prompt = `Imagine que "${searchTerm}" é o título de um livro interessante. 
        Crie uma breve descrição ficcional (máximo 2 frases) para este livro imaginário. 
        RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL. 
        Não mencione que é um livro imaginário ou que você está criando uma descrição.
        Seja criativo e capture a essência do que poderia ser este livro.`;
        
        // Preparar a requisição
        const requestData = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 200,
                topP: 0.9,
                topK: 40
            }
        };
        
        // Fazer a requisição à API
        const response = await fetch(`${GEMINI_CONFIG.apiUrl}?key=${GEMINI_CONFIG.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API do Gemini: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extrair o texto da resposta
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            return data.candidates[0].content.parts[0].text.trim();
        } else {
            throw new Error("Formato de resposta inesperado da API Gemini");
        }
    } catch (error) {
        console.error("Erro ao gerar descrição da busca com Gemini:", error);
        return `Resultados para "${searchTerm}"`;
    }
}

/**
 * Gera recomendações de livros com base em histórico e favoritos
 * @param {Array} favoriteBooks - Lista de livros favoritos
 * @param {Array} searchHistory - Histórico de pesquisas
 * @returns {Promise<Array>} - Array com recomendações geradas
 */
async function generateRecommendations(favoriteBooks = [], searchHistory = []) {
    // Verificar se temos uma chave API configurada
    if (GEMINI_CONFIG.apiKey === "AIzaSyCDqalwwc3yJkwvb7kHZnjCL2J_fM3AXKg") {
        return generateDefaultRecommendations();
    }
    
    try {
        // Construir o prompt para o Gemini
        let prompt = `RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL. Gere 5 recomendações de livros baseadas nos seguintes dados:\n\n`;
        
        // Adicionar informações sobre livros favoritos, se disponíveis
        if (favoriteBooks && favoriteBooks.length > 0) {
            prompt += "Livros favoritos do usuário:\n";
            favoriteBooks.slice(0, 5).forEach((book, index) => {
                prompt += `${index + 1}. "${book.title}" por ${book.authors.join(', ')}\n`;
                if (book.categories && book.categories.length > 0) {
                    prompt += `   Categorias: ${book.categories.join(', ')}\n`;
                }
            });
            prompt += "\n";
        }
        
        // Adicionar informações sobre histórico de pesquisa, se disponível
        if (searchHistory && searchHistory.length > 0) {
            prompt += "Termos de busca recentes do usuário:\n";
            searchHistory.slice(0, 10).forEach((term, index) => {
                prompt += `${index + 1}. "${term}"\n`;
            });
            prompt += "\n";
        }
        
        prompt += `Baseado nas informações acima, sugira 5 livros que o usuário possa gostar.
        Formate a resposta como uma lista de livros com o seguinte formato para cada livro:
        TÍTULO|AUTOR|ANO|URL_IMAGEM|CATEGORIA
        
        Onde URL_IMAGEM deve ser um link para uma capa de livro válida (pode ser uma URL genérica de placeholder).
        Escolha livros populares e bem conhecidos, de gêneros variados mas alinhados com os interesses do usuário.
        Não inclua nenhum texto explicativo, apenas os 5 livros no formato solicitado, um por linha.`;
        
        // Preparar a requisição
        const requestData = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
                topP: 0.9,
                topK: 40
            }
        };
        
        // Fazer a requisição à API
        const response = await fetch(`${GEMINI_CONFIG.apiUrl}?key=${GEMINI_CONFIG.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API do Gemini: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extrair o texto da resposta
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            const responseText = data.candidates[0].content.parts[0].text.trim();
            return parseRecommendationResponse(responseText);
        } else {
            throw new Error("Formato de resposta inesperado da API Gemini");
        }
    } catch (error) {
        console.error("Erro ao gerar recomendações com Gemini:", error);
        return generateDefaultRecommendations();
    }
}

/**
 * Analisa a resposta de texto do Gemini e converte em objetos de recomendação
 * @param {string} responseText - Texto de resposta do Gemini
 * @returns {Array} - Array de objetos de recomendação
 */
function parseRecommendationResponse(responseText) {
    const recommendations = [];
    
    // Dividir por linhas e processar cada uma
    const lines = responseText.split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
        // Ignorar linhas que não parecem ter o formato correto
        if (!line.includes('|')) continue;
        
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 5) {
            recommendations.push({
                title: parts[0],
                author: parts[1],
                year: parts[2],
                thumbnail: parts[3] || 'https://via.placeholder.com/150x200?text=Sem+Capa',
                category: parts[4],
                description: `Um livro de ${parts[1]} sobre ${parts[4].toLowerCase()}.`
            });
        }
    }
    
    return recommendations.slice(0, 5); // Garantir que retornamos no máximo 5 recomendações
}

/**
 * Gera recomendações padrão quando o Gemini não está disponível
 * @returns {Array} - Array de objetos de recomendação padrão
 */
function generateDefaultRecommendations() {
    return [
        {
            title: "Cem Anos de Solidão",
            author: "Gabriel García Márquez",
            year: "1967",
            thumbnail: "https://m.media-amazon.com/images/I/71IYwmQGj5L._SY466_.jpg",
            category: "Realismo Mágico",
            description: "Uma saga que narra a história da família Buendía ao longo de sete gerações na fictícia cidade de Macondo."
        },
        {
            title: "1984",
            author: "George Orwell",
            year: "1949",
            thumbnail: "https://m.media-amazon.com/images/I/819js3EQwbL._SY466_.jpg",
            category: "Ficção Distópica",
            description: "Uma visão aterrorizante de um futuro totalitário onde o governo exerce controle absoluto sobre todos os aspectos da vida."
        },
        {
            title: "O Pequeno Príncipe",
            author: "Antoine de Saint-Exupéry",
            year: "1943",
            thumbnail: "https://m.media-amazon.com/images/I/41afCn3PQUL._SY445_SX342_.jpg",
            category: "Literatura Infantil",
            description: "Uma fábula poética que aborda temas profundos sobre a vida, relacionamentos e a sociedade."
        },
        {
            title: "Crime e Castigo",
            author: "Fiódor Dostoiévski",
            year: "1866",
            thumbnail: "https://m.media-amazon.com/images/I/81quIJIdkdL._SY466_.jpg",
            category: "Romance Psicológico",
            description: "A história de um ex-estudante que comete um assassinato e sofre com as consequências psicológicas."
        },
        {
            title: "Dom Casmurro",
            author: "Machado de Assis",
            year: "1899",
            thumbnail: "https://m.media-amazon.com/images/I/61x1ZT55BhL._SY466_.jpg",
            category: "Literatura Brasileira",
            description: "Um dos grandes romances da literatura brasileira que explora o ciúme e a dúvida através da história de Bentinho e Capitu."
        }
    ];
}

/**
 * Gera uma descrição alternativa para quando a API do Gemini não está disponível
 * @param {Object} book - Objeto com informações do livro
 * @returns {string} - Descrição gerada localmente
 */
function generateFallbackDescription(book) {
    // Se já temos uma boa descrição, retornar ela mesma
    if (book.description && 
        book.description !== 'Sem descrição disponível' && 
        book.description !== 'Descrição não disponível na API do Open Library') {
        return book.description;
    }
    
    // Construir uma descrição simples com base nos metadados disponíveis
    let description = `"${book.title}" `;
    
    if (book.authors && book.authors.length > 0) {
        if (book.authors.length === 1) {
            description += `foi escrito por ${book.authors[0]}`;
        } else {
            const lastAuthor = book.authors.pop();
            description += `foi escrito por ${book.authors.join(', ')} e ${lastAuthor}`;
        }
    }
    
    if (book.publishedDate) {
        description += ` e publicado em ${book.publishedDate}`;
    }
    
    description += '.';
    
    // Adicionar informações sobre categorias, se disponíveis
    if (book.categories && book.categories.length > 0) {
        description += ` Este livro se enquadra ${book.categories.length > 1 ? 'nas categorias' : 'na categoria'} de ${book.categories.slice(0, 3).join(', ')}`;
        if (book.categories.length > 3) {
            description += ', entre outras';
        }
        description += '.';
    }
    
    return description;
}

/**
 * Analisa um livro e retorna insights sobre ele
 * @param {Object} book - Objeto com informações do livro
 * @returns {Promise<Object>} - Objeto com análises e insights
 */
async function analyzeBook(book) {
    // Esta função poderia usar a API do Gemini para análises mais profundas
    // Por enquanto, retorna apenas algumas informações básicas
    return {
        recommendedFor: getRecommendedAudience(book),
        complexity: estimateComplexity(book),
        similarBooks: [] // Poderia ser preenchido com uma chamada real à API
    };
}

/**
 * Estima para qual público o livro é mais recomendado
 * @param {Object} book - Objeto com informações do livro
 * @returns {string} - Público recomendado
 */
function getRecommendedAudience(book) {
    // Lógica simplificada baseada em categorias
    const categories = book.categories || [];
    const lowerCategories = categories.map(cat => cat.toLowerCase());
    
    if (lowerCategories.some(cat => cat.includes('infantil') || cat.includes('criança'))) {
        return 'Crianças';
    } else if (lowerCategories.some(cat => cat.includes('juvenil') || cat.includes('young adult'))) {
        return 'Adolescentes';
    } else if (lowerCategories.some(cat => 
        cat.includes('acadêmico') || 
        cat.includes('técnico') || 
        cat.includes('científico'))) {
        return 'Acadêmicos e Pesquisadores';
    }
    
    return 'Leitores adultos em geral';
}

/**
 * Estima a complexidade do livro com base em suas metainformações
 * @param {Object} book - Objeto com informações do livro
 * @returns {string} - Nível de complexidade estimado
 */
function estimateComplexity(book) {
    // Lógica simplificada baseada em categorias e tamanho
    const categories = book.categories || [];
    const lowerCategories = categories.map(cat => cat.toLowerCase());
    
    if (lowerCategories.some(cat => 
        cat.includes('filosofia') || 
        cat.includes('científico') || 
        cat.includes('técnico'))) {
        return 'Avançado';
    } else if (lowerCategories.some(cat => 
        cat.includes('infantil') || 
        cat.includes('criança'))) {
        return 'Simples';
    }
    
    // Considerar o número de páginas, se disponível
    if (book.pageCount) {
        if (book.pageCount > 500) return 'Avançado';
        if (book.pageCount < 200) return 'Acessível';
    }
    
    return 'Intermediário';
} 