/**
 * api.js - Gerencia conexões com APIs de livros
 * Implementa métodos para buscar livros em diferentes APIs
 */

// Configuração das APIs
const APIs = {
    GOOGLE_BOOKS: {
        name: 'Google Books',
        baseUrl: 'https://www.googleapis.com/books/v1/volumes',
        searchUrl: 'https://www.googleapis.com/books/v1/volumes?q='
    },
    OPEN_LIBRARY: {
        name: 'Open Library',
        baseUrl: 'https://openlibrary.org/search.json',
        searchUrl: 'https://openlibrary.org/search.json?q='
    }
};

// API atual selecionada
let currentAPI = APIs.GOOGLE_BOOKS;

// Expor as funções globalmente
window.searchBooks = searchBooks;
window.getRandomBook = getRandomBook;

/**
 * Muda a API utilizada
 * @param {string} apiKey - Chave da API a ser utilizada
 */
function changeAPI(apiKey) {
    if (APIs[apiKey]) {
        currentAPI = APIs[apiKey];
        return true;
    }
    return false;
}

/**
 * Busca livros na API do Google Books
 * @param {string} query - Termo de busca
 * @param {Object} options - Opções de filtragem e ordenação
 * @returns {Promise} - Promise com os resultados
 */
async function searchGoogleBooks(query, options = {}) {
    // Construir os parâmetros de busca
    let searchFields = [];
    
    // Verificar campos de busca selecionados
    if (options.fields) {
        if (options.fields.title) searchFields.push(`intitle:${query}`);
        if (options.fields.author) searchFields.push(`inauthor:${query}`);
        if (options.fields.publisher) searchFields.push(`inpublisher:${query}`);
        if (options.fields.subject) searchFields.push(`subject:${query}`);
    }
    
    // Se nenhum campo específico foi selecionado, usa a busca geral
    const searchQuery = searchFields.length > 0 ? searchFields.join('+OR+') : query;
    
    // Construir URL com parâmetros
    let url = `${APIs.GOOGLE_BOOKS.searchUrl}${encodeURIComponent(searchQuery)}&maxResults=20`;
    
    // Adicionar ordenação
    if (options.sort) {
        // Google Books só suporta ordenação por relevância (padrão) ou mais recentes
        if (options.sort === 'newest') {
            url += '&orderBy=newest';
        }
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.items) {
            return { 
                success: true, 
                count: 0, 
                books: [],
                source: APIs.GOOGLE_BOOKS.name
            };
        }
        
        // Transformar os resultados em um formato padrão
        const books = data.items.map(item => {
            const volumeInfo = item.volumeInfo || {};
            
            return {
                id: item.id,
                title: volumeInfo.title || 'Título desconhecido',
                authors: volumeInfo.authors || ['Autor desconhecido'],
                publisher: volumeInfo.publisher || 'Editora desconhecida',
                publishedDate: volumeInfo.publishedDate || 'Data desconhecida',
                description: volumeInfo.description || 'Sem descrição disponível',
                categories: volumeInfo.categories || [],
                thumbnail: volumeInfo.imageLinks?.thumbnail || null,
                pageCount: volumeInfo.pageCount || null,
                language: volumeInfo.language || null,
                infoLink: volumeInfo.infoLink || null,
                previewLink: volumeInfo.previewLink || null
            };
        });
        
        // Aplicar ordenação local, se necessário
        if (options.sort && ['title', 'author'].includes(options.sort)) {
            if (options.sort === 'title') {
                books.sort((a, b) => a.title.localeCompare(b.title));
            } else if (options.sort === 'author') {
                books.sort((a, b) => {
                    const authorA = a.authors[0] || '';
                    const authorB = b.authors[0] || '';
                    return authorA.localeCompare(authorB);
                });
            }
        }
        
        return {
            success: true,
            count: books.length,
            books: books,
            source: APIs.GOOGLE_BOOKS.name
        };
    } catch (error) {
        console.error('Erro ao buscar no Google Books:', error);
        return {
            success: false,
            error: 'Falha ao conectar com a API do Google Books',
            source: APIs.GOOGLE_BOOKS.name
        };
    }
}

/**
 * Busca livros na API do Open Library
 * @param {string} query - Termo de busca
 * @param {Object} options - Opções de filtragem e ordenação
 * @returns {Promise} - Promise com os resultados
 */
async function searchOpenLibrary(query, options = {}) {
    // Parâmetros base da URL
    let url = `${APIs.OPEN_LIBRARY.searchUrl}${encodeURIComponent(query)}`;
    
    // Adicionar campos de busca específicos, se selecionados
    if (options.fields) {
        // Remover a URL base e construir uma nova
        url = APIs.OPEN_LIBRARY.baseUrl + '?';
        
        const searchParams = [];
        
        if (options.fields.title) searchParams.push(`title=${encodeURIComponent(query)}`);
        if (options.fields.author) searchParams.push(`author=${encodeURIComponent(query)}`);
        if (options.fields.publisher) searchParams.push(`publisher=${encodeURIComponent(query)}`);
        if (options.fields.subject) searchParams.push(`subject=${encodeURIComponent(query)}`);
        
        // Se nenhum campo específico foi selecionado, usa a busca geral
        if (searchParams.length > 0) {
            url += searchParams.join('&');
        } else {
            url += `q=${encodeURIComponent(query)}`;
        }
    }
    
    // Adicionar parâmetros de ordenação
    if (options.sort) {
        switch(options.sort) {
            case 'newest':
                url += '&sort=new';
                break;
            case 'title':
                url += '&sort=title';
                break;
            // Relevância é o padrão do Open Library
        }
    }
    
    // Adicionar limite de resultados
    url += '&limit=20';
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.docs || data.docs.length === 0) {
            return { 
                success: true, 
                count: 0, 
                books: [],
                source: APIs.OPEN_LIBRARY.name
            };
        }
        
        // Transformar os resultados em um formato padrão
        const books = data.docs.map(doc => {
            return {
                id: doc.key,
                title: doc.title || 'Título desconhecido',
                authors: doc.author_name || ['Autor desconhecido'],
                publisher: doc.publisher?.[0] || 'Editora desconhecida',
                publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : 'Data desconhecida',
                description: 'Descrição não disponível na API do Open Library',
                categories: doc.subject || [],
                thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
                pageCount: null,
                language: doc.language || null,
                infoLink: `https://openlibrary.org${doc.key}`,
                previewLink: null
            };
        });
        
        // Ordenação de autor é aplicada manualmente (se necessário)
        if (options.sort === 'author') {
            books.sort((a, b) => {
                const authorA = a.authors[0] || '';
                const authorB = b.authors[0] || '';
                return authorA.localeCompare(authorB);
            });
        }
        
        return {
            success: true,
            count: books.length,
            books: books,
            source: APIs.OPEN_LIBRARY.name
        };
    } catch (error) {
        console.error('Erro ao buscar no Open Library:', error);
        return {
            success: false,
            error: 'Falha ao conectar com a API do Open Library',
            source: APIs.OPEN_LIBRARY.name
        };
    }
}

/**
 * Busca livros na API selecionada
 * @param {string} query - Termo de busca
 * @param {Object} options - Opções de filtragem e ordenação
 * @returns {Promise} - Promise com os resultados
 */
async function searchBooks(query, options = {}) {
    // Verifica se a busca está vazia
    if (!query || query.trim() === '') {
        return { 
            success: false, 
            error: 'Por favor, digite um termo de busca.',
            source: currentAPI.name
        };
    }
    
    // Escolhe a API apropriada para a busca
    if (currentAPI === APIs.GOOGLE_BOOKS) {
        return await searchGoogleBooks(query, options);
    } else if (currentAPI === APIs.OPEN_LIBRARY) {
        return await searchOpenLibrary(query, options);
    } else {
        // API padrão em caso de erro
        return await searchGoogleBooks(query, options);
    }
}

/**
 * Retorna um livro aleatório baseado em um termo de busca
 * @returns {Promise} - Promise com um livro aleatório
 */
async function getRandomBook() {
    // Lista de termos populares para busca aleatória
    const randomTerms = [
        'fiction', 'literature', 'science', 'fantasy', 
        'history', 'philosophy', 'romance', 'classic',
        'biography', 'adventure', 'thriller', 'horror'
    ];
    
    // Escolhe um termo aleatório
    const randomTerm = randomTerms[Math.floor(Math.random() * randomTerms.length)];
    
    try {
        // Busca livros com o termo aleatório
        const result = await searchBooks(randomTerm);
        
        if (result.success && result.books.length > 0) {
            // Escolhe um livro aleatório da lista
            const randomIndex = Math.floor(Math.random() * result.books.length);
            return {
                success: true,
                book: result.books[randomIndex],
                source: result.source
            };
        } else {
            // Tenta novamente com 'book' como termo de busca
            const fallbackResult = await searchBooks('book');
            
            if (fallbackResult.success && fallbackResult.books.length > 0) {
                const randomIndex = Math.floor(Math.random() * fallbackResult.books.length);
                return {
                    success: true,
                    book: fallbackResult.books[randomIndex],
                    source: fallbackResult.source
                };
            } else {
                return {
                    success: false,
                    error: 'Não foi possível encontrar um livro aleatório.',
                    source: currentAPI.name
                };
            }
        }
    } catch (error) {
        console.error('Erro ao buscar livro aleatório:', error);
        return {
            success: false,
            error: 'Falha ao buscar um livro aleatório.',
            source: currentAPI.name
        };
    }
}

// Exportar funções para uso global
window.BookAPI = {
    search: searchBooks,
    getRandomBook,
    changeAPI
}; 
