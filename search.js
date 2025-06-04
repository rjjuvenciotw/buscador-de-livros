/**
 * search.js - Funções de busca de livros
 * Responsável pela busca e exibição de resultados
 */

// Evento quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar os botões de busca
    const normalSearchBtn = document.getElementById('normalSearchBtn');
    
    if (normalSearchBtn) {
        normalSearchBtn.addEventListener('click', function() {
            performSearch();
        });
    }
    
    // Permitir busca ao pressionar Enter no campo de pesquisa
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Configurar o ícone de busca
    const searchIcon = document.getElementById('searchButton');
    if (searchIcon) {
        searchIcon.addEventListener('click', function() {
            performSearch();
        });
    }
    
    // Configurar o dropdown de filtros
    const filterBtn = document.querySelector('.filter-btn');
    const filterContent = document.querySelector('.filter-content');
    
    if (filterBtn && filterContent) {
        filterBtn.addEventListener('click', function() {
            filterContent.classList.toggle('show');
        });
        
        // Fechar o dropdown quando clicar fora dele
        window.addEventListener('click', function(e) {
            if (!e.target.matches('.filter-btn') && !filterContent.contains(e.target)) {
                filterContent.classList.remove('show');
            }
        });
    }
    
    // Configurar o botão de aplicar filtros
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            filterContent.classList.remove('show');
            performSearch();
        });
    }
    
    // Configuração do modal de detalhes
    const modal = document.getElementById('bookDetailModal');
    const closeModalBtn = document.querySelector('.close-modal');
    
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Fechar o modal ao clicar fora dele
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Carregar a chave da API do Gemini se estiver disponível
    if (window.StorageManager && typeof window.StorageManager.getApiKey === 'function') {
        const apiKey = window.StorageManager.getApiKey();
        if (apiKey && window.GeminiAPI && typeof window.GeminiAPI.init === 'function') {
            window.GeminiAPI.init(apiKey);
            
            // Preencher o campo da chave da API se existir
            const apiKeyInput = document.getElementById('geminiApiKey');
            if (apiKeyInput) {
                apiKeyInput.value = apiKey;
            }
        }
    }
});

// Função para realizar a busca
async function performSearch() {
    console.log("Iniciando busca...");
    
    // Mostrar indicador de carregamento
    const loadingIndicator = document.getElementById('loading');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    
    // Limpar resultados anteriores
    const resultsList = document.getElementById('resultsList');
    if (resultsList) {
        resultsList.innerHTML = '';
    }
    
    // Ocultar a seção de resultados até que a busca seja concluída
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
    
    // Obter o termo de busca
    const searchInput = document.getElementById('searchInput');
    if (!searchInput || searchInput.value.trim() === '') {
        // Esconder indicador de carregamento se não houver termo de busca
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        return;
    }
    
    const searchTerm = searchInput.value.trim();
    console.log("Termo de busca:", searchTerm);
    
    // Salvar no histórico
    if (window.StorageManager && typeof window.StorageManager.addToHistory === 'function') {
        window.StorageManager.addToHistory(searchTerm);
        
        // Atualizar a lista de histórico se a função estiver disponível
        if (typeof window.populateHistoryList === 'function') {
            window.populateHistoryList();
        }
    }
    
    // Obter as opções de filtro
    const titleEnabled = document.getElementById('titleField')?.checked ?? true;
    const authorEnabled = document.getElementById('authorField')?.checked ?? true;
    const publisherEnabled = document.getElementById('publisherField')?.checked ?? false;
    const subjectEnabled = document.getElementById('subjectField')?.checked ?? false;
    
    // Obter opção de ordenação
    let orderBy = 'relevance';
    if (document.getElementById('newestSort')?.checked) orderBy = 'newest';
    if (document.getElementById('titleSort')?.checked) orderBy = 'title';
    if (document.getElementById('authorSort')?.checked) orderBy = 'author';
    
    // Determinar se devemos usar o Gemini para descrições
    const useGemini = document.getElementById('useGemini')?.checked ?? false;
    
    try {
        // Gerar descrição da busca com Gemini se habilitado
        if (useGemini && window.GeminiAPI && typeof window.GeminiAPI.getSearchDescription === 'function') {
            const searchDescription = document.getElementById('searchDescription');
            if (searchDescription) {
                searchDescription.textContent = 'Gerando descrição...';
                searchDescription.style.display = 'block';
                
                try {
                    const description = await window.GeminiAPI.getSearchDescription(searchTerm);
                    searchDescription.textContent = description;
                } catch (error) {
                    console.error('Erro ao gerar descrição da busca:', error);
                    searchDescription.textContent = `Resultados para "${searchTerm}"`;
                }
            }
        } else {
            // Exibir um título simples se o Gemini não estiver habilitado
            const searchDescription = document.getElementById('searchDescription');
            if (searchDescription) {
                searchDescription.textContent = `Resultados para "${searchTerm}"`;
                searchDescription.style.display = 'block';
            }
        }
        
        let results = null;
        
        // Tentar busca utilizando API externa se disponível
        if (window.searchBooks && typeof window.searchBooks === 'function') {
            console.log("Usando API externa para busca");
            try {
                const apiResult = await window.searchBooks(searchTerm, {
                    fields: {
                        title: titleEnabled,
                        author: authorEnabled,
                        publisher: publisherEnabled,
                        subject: subjectEnabled
                    },
                    sort: orderBy
                });
                
                console.log("Resultado da API externa:", apiResult);
                
                if (apiResult && apiResult.success && apiResult.books && apiResult.books.length > 0) {
                    // Adaptar formato da API externa para nosso formato interno
                    results = {
                        items: apiResult.books,
                        totalItems: apiResult.count
                    };
                    console.log("Resultados convertidos da API externa:", results);
                }
            } catch (e) {
                console.error('Erro na API externa:', e);
            }
        }
        
        // Se não conseguiu resultados da API externa, usar implementação local
        if (!results) {
            console.log("Usando implementação local de busca");
            results = await searchGoogleBooks(searchTerm, {
                titleEnabled,
                authorEnabled,
                publisherEnabled,
                subjectEnabled,
                orderBy
            });
            console.log("Resultados da implementação local:", results);
        }
        
        // Exibir os resultados
        if (results && results.items && results.items.length > 0) {
            console.log(`Exibindo ${results.items.length} resultados`);
            displayResults(results, useGemini);
            
            // Mostrar a seção de resultados
            if (resultsContainer) {
                resultsContainer.style.display = 'block';
            }
        } else {
            console.log("Nenhum resultado encontrado");
            
            // Mostrar mensagem de nenhum resultado
            if (resultsList) {
                resultsList.innerHTML = '<div class="no-results">Nenhum resultado encontrado para esta busca.</div>';
            }
            
            // Mostrar a seção de resultados para exibir a mensagem
            if (resultsContainer) {
                resultsContainer.style.display = 'block';
            }
        }
        
    } catch (error) {
        console.error('Erro na busca:', error);
        
        // Em caso de erro, mostrar mensagem de erro
        if (resultsList) {
            resultsList.innerHTML = `<div class="error-message">Não foi possível realizar a busca. Por favor, tente novamente mais tarde.</div>`;
        }
        
        // Mostrar a seção de resultados para exibir a mensagem de erro
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
        }
    } finally {
        // Esconder indicador de carregamento
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

// Exibir os resultados da busca
async function displayResults(results, useGemini = false) {
    // Obter elementos da interface
    const resultsList = document.getElementById('resultsList');
    const loadingIndicator = document.getElementById('loading');
    
    // Garantir que a lista de resultados exista
    if (!resultsList) {
        console.error('Elemento resultsList não encontrado');
        return;
    }
    
    // Esconder indicador de carregamento
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // Log para debug
    console.log("Resultados recebidos:", results);
    
    // Verificar se temos resultados
    if (!results || !results.items || results.items.length === 0) {
        // Mostrar mensagem de nenhum resultado
        resultsList.innerHTML = '<div class="no-results">Nenhum resultado encontrado para esta busca.</div>';
        return;
    }
    
    // Limpar resultados anteriores
    resultsList.innerHTML = '';
    
    // Processar e exibir cada resultado
    for (const book of results.items) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.setAttribute('data-id', book.id);
        
        // Processar a descrição com Gemini se estiver habilitado
        let description = book.description || 'Sem descrição disponível';
        let isAIDescription = false;
        
        if (useGemini && window.GeminiAPI && typeof window.GeminiAPI.getBookDescription === 'function') {
            try {
                // Tentar obter descrição AI e definir flag para o badge
                description = await window.GeminiAPI.getBookDescription(book);
                isAIDescription = true;
            } catch (error) {
                console.error('Erro ao gerar descrição com Gemini:', error);
                // Em caso de erro, manter a descrição original
            }
        }
        
        // Truncar a descrição se for muito longa
        const maxDescLength = 200;
        if (description.length > maxDescLength) {
            description = description.substring(0, maxDescLength) + '...';
        }
        
        // Preparar a URL da capa
        const coverUrl = book.thumbnail || 'https://via.placeholder.com/150x200?text=Sem+Capa';
        
        // Construir o HTML do item com ícones
        resultItem.innerHTML = `
            <img src="${coverUrl}" alt="${book.title}" class="result-thumbnail">
            <div class="result-content">
                <h3 class="result-title">${book.title}</h3>
                <p class="result-author"><i class="icon fas fa-user"></i>${book.authors ? book.authors.join(', ') : 'Autor desconhecido'}</p>
                <div class="result-meta">
                    ${book.publishedDate ? `<span><i class="icon fas fa-calendar"></i>${book.publishedDate}</span>` : ''}
                    ${book.publisher ? `<span><i class="icon fas fa-building"></i>${book.publisher}</span>` : ''}
                    ${book.pageCount ? `<span><i class="icon fas fa-file"></i>${book.pageCount} páginas</span>` : ''}
                </div>
                <p class="result-description">
                    ${description}
                    ${isAIDescription ? '<span class="ai-badge">IA</span>' : ''}
                </p>
                <div class="result-links">
                    ${book.infoLink ? `<a href="${book.infoLink}" target="_blank" class="result-link"><i class="fas fa-info-circle"></i> Detalhes</a>` : ''}
                    ${book.previewLink ? `<a href="${book.previewLink}" target="_blank" class="result-link"><i class="fas fa-eye"></i> Prévia</a>` : ''}
                    <a href="#" class="result-link view-details" data-book-id="${book.id}"><i class="fas fa-plus-circle"></i> Ver mais</a>
                </div>
            </div>
        `;
        
        // Adicionar evento para o botão "Ver mais"
        const viewDetailsBtn = resultItem.querySelector('.view-details');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                displayBookDetails(book);
            });
        }
        
        // Adicionar o resultado à lista
        resultsList.appendChild(resultItem);
    }
    
    // Certificar-se de que o container de resultados está visível
    const resultsContainer = document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
    }
    
    // Log para debug
    console.log(`Exibidos ${results.items.length} resultados`);
}

/**
 * Exibe os detalhes de um livro em um modal
 * @param {Object} book - Objeto do livro a ser exibido
 */
function displayBookDetails(book) {
    const modal = document.getElementById('bookDetailModal');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal || !modalContent) return;
    
    // Verificar se temos descrição com IA
    let description = book.description || 'Sem descrição disponível';
    let isAIDescription = false;
    
    if (window.GeminiAPI && typeof window.GeminiAPI.getBookDescription === 'function') {
        (async function() {
            try {
                const aiDescription = await window.GeminiAPI.getBookDescription(book);
                const descElement = document.querySelector('.book-detail-description');
                if (descElement) {
                    descElement.innerHTML = `
                        ${aiDescription}
                        <span class="ai-badge">IA</span>
                    `;
                }
            } catch (error) {
                console.error('Erro ao gerar descrição para modal:', error);
            }
        })();
        
        isAIDescription = true;
    }
    
    // Preparar a URL da capa
    const coverUrl = book.thumbnail || 'https://via.placeholder.com/300x450?text=Sem+Capa';
    
    // Preencher o conteúdo do modal
    modalContent.innerHTML = `
        <div class="book-detail-header">
            <img src="${coverUrl}" alt="${book.title}" class="book-detail-img">
            <div class="book-detail-info">
                <h2 class="book-detail-title">${book.title}</h2>
                <p class="book-detail-author"><i class="fas fa-user"></i> por ${book.authors ? book.authors.join(', ') : 'Autor desconhecido'}</p>
                <div class="book-detail-meta">
                    ${book.publishedDate ? `<span><i class="fas fa-calendar"></i> ${book.publishedDate}</span>` : ''}
                    ${book.publisher ? `<span><i class="fas fa-building"></i> ${book.publisher}</span>` : ''}
                    ${book.pageCount ? `<span><i class="fas fa-file"></i> ${book.pageCount} páginas</span>` : ''}
                </div>
            </div>
        </div>
        
        <div class="book-detail-section">
            <h3 class="book-detail-section-title"><i class="fas fa-align-left"></i> Descrição</h3>
            <p class="book-detail-description">
                ${description}
                ${isAIDescription ? '<span class="ai-badge">IA</span>' : ''}
            </p>
        </div>
        
        ${book.categories && book.categories.length > 0 ? `
        <div class="book-detail-section">
            <h3 class="book-detail-section-title"><i class="fas fa-tag"></i> Categorias</h3>
            <p>${book.categories.join(', ')}</p>
        </div>
        ` : ''}
        
        <div class="book-detail-actions">
            ${book.infoLink ? `<a href="${book.infoLink}" target="_blank" class="result-link"><i class="fas fa-info-circle"></i> Detalhes</a>` : ''}
            ${book.previewLink ? `<a href="${book.previewLink}" target="_blank" class="result-link"><i class="fas fa-eye"></i> Prévia</a>` : ''}
        </div>
    `;
    
    // Mostrar o modal
    modal.style.display = 'block';
}

/**
 * Busca livros na API do Google Books
 * @param {string} query - Termo de busca
 * @param {Object} options - Opções de busca
 * @returns {Promise<Object>} - Objeto com resultados da busca
 */
async function searchGoogleBooks(query, options = {}) {
    console.log("Buscando no Google Books com termo:", query);
    console.log("Opções de filtro:", options);
    
    // Construir a URL da API
    let apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
    
    // Adicionar parâmetros de busca específicos se habilitados
    if (options.titleEnabled || options.authorEnabled || options.publisherEnabled || options.subjectEnabled) {
        // Se pelo menos um filtro está habilitado, usamos filtros específicos
        apiUrl = 'https://www.googleapis.com/books/v1/volumes?q=';
        
        const searchParts = [];
        
        if (options.titleEnabled) {
            searchParts.push(`intitle:${encodeURIComponent(query)}`);
        }
        
        if (options.authorEnabled) {
            searchParts.push(`inauthor:${encodeURIComponent(query)}`);
        }
        
        if (options.publisherEnabled) {
            searchParts.push(`inpublisher:${encodeURIComponent(query)}`);
        }
        
        if (options.subjectEnabled) {
            searchParts.push(`subject:${encodeURIComponent(query)}`);
        }
        
        // Se nenhum campo específico foi selecionado, usar a busca geral
        if (searchParts.length === 0) {
            apiUrl += encodeURIComponent(query);
        } else {
            apiUrl += searchParts.join('+OR+');
        }
    }
    
    // Adicionar ordenação
    if (options.orderBy) {
        let orderParam = 'relevance';
        
        switch (options.orderBy) {
            case 'newest':
                orderParam = 'newest';
                break;
            case 'title':
                // Google Books não suporta ordenação por título diretamente
                orderParam = 'relevance';
                break;
            case 'author':
                // Google Books não suporta ordenação por autor diretamente
                orderParam = 'relevance';
                break;
        }
        
        apiUrl += `&orderBy=${orderParam}`;
    }
    
    // Adicionar limite de resultados
    apiUrl += '&maxResults=20';
    
    console.log("URL de busca:", apiUrl);
    
    try {
        // Fazer a requisição à API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            console.error(`Erro na API do Google Books: ${response.status}`);
            throw new Error(`Erro na API do Google Books: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar se temos resultados
        if (!data.items || data.items.length === 0) {
            console.log("Nenhum resultado encontrado na API Google Books");
            return {
                items: [],
                totalItems: 0
            };
        }
        
        // Processar os resultados para um formato uniforme
        const processedResults = {
            items: data.items.map(item => {
                const volumeInfo = item.volumeInfo || {};
                
                return {
                    id: item.id,
                    title: volumeInfo.title || 'Título desconhecido',
                    authors: volumeInfo.authors || ['Autor desconhecido'],
                    publisher: volumeInfo.publisher || 'Editora desconhecida',
                    publishedDate: volumeInfo.publishedDate || 'Data desconhecida',
                    description: volumeInfo.description || 'Sem descrição disponível',
                    pageCount: volumeInfo.pageCount,
                    categories: volumeInfo.categories || [],
                    thumbnail: volumeInfo.imageLinks ? (volumeInfo.imageLinks.thumbnail || volumeInfo.imageLinks.smallThumbnail) : null,
                    language: volumeInfo.language,
                    previewLink: volumeInfo.previewLink,
                    infoLink: volumeInfo.infoLink
                };
            }),
            totalItems: data.totalItems || data.items.length
        };
        
        return processedResults;
    } catch (error) {
        console.error('Erro ao buscar no Google Books:', error);
        throw error;
    }
}

/**
 * Busca livros na API do Open Library
 * @param {string} query - Termo de busca
 * @returns {Promise<Object>} - Objeto com resultados da busca
 */
async function searchOpenLibrary(query) {
    // Construir a URL da API
    const apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
    
    try {
        // Fazer a requisição à API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Erro na API do Open Library: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar se temos resultados
        if (!data.docs || data.docs.length === 0) {
            return {
                items: [],
                totalItems: 0
            };
        }
        
        // Processar os resultados para um formato uniforme
        const processedResults = {
            items: data.docs.map(doc => {
                // Gerar um ID único baseado no título e autor
                const id = `ol_${doc.key || (doc.title + '_' + (doc.author_name ? doc.author_name[0] : '')).replace(/\s+/g, '_')}`;
                
                return {
                    id: id,
                    title: doc.title || 'Título desconhecido',
                    authors: doc.author_name || ['Autor desconhecido'],
                    publisher: doc.publisher ? doc.publisher[0] : 'Editora desconhecida',
                    publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : 'Data desconhecida',
                    description: 'Descrição não disponível na API do Open Library',
                    pageCount: doc.number_of_pages_median || null,
                    categories: doc.subject || [],
                    thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
                    language: doc.language ? doc.language[0] : null,
                    previewLink: doc.key ? `https://openlibrary.org${doc.key}` : null,
                    infoLink: doc.key ? `https://openlibrary.org${doc.key}` : null
                };
            }),
            totalItems: data.numFound || data.docs.length
        };
        
        return processedResults;
    } catch (error) {
        console.error('Erro ao buscar no Open Library:', error);
        throw error;
    }
}

// Exportar funções para uso global
window.displayBookDetails = displayBookDetails; 