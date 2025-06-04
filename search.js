/**
 * search.js - Funções de busca de livros
 * Responsável pela busca e exibição de resultados
 */

// Evento quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar os botões de busca
    const botaoBuscaNormal = document.getElementById('normalSearchBtn');
    
    if (botaoBuscaNormal) {
        botaoBuscaNormal.addEventListener('click', function() {
            executarBusca();
        });
    }
    
    // Permitir busca ao pressionar Enter no campo de pesquisa
    const campoBuscaPrincipal = document.getElementById('searchInput');
    if (campoBuscaPrincipal) {
        campoBuscaPrincipal.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                executarBusca();
            }
        });
    }
    
    // Configurar o ícone de busca
    const iconeBusca = document.getElementById('searchButton');
    if (iconeBusca) {
        iconeBusca.addEventListener('click', function() {
            executarBusca();
        });
    }
    
    // Configurar o dropdown de filtros
    const botaoFiltro = document.querySelector('.filter-btn');
    const conteudoFiltro = document.querySelector('.filter-content');
    
    if (botaoFiltro && conteudoFiltro) {
        botaoFiltro.addEventListener('click', function() {
            conteudoFiltro.classList.toggle('show');
        });
        
        // Fechar o dropdown quando clicar fora dele
        window.addEventListener('click', function(e) {
            if (!e.target.matches('.filter-btn') && !conteudoFiltro.contains(e.target)) {
                conteudoFiltro.classList.remove('show');
            }
        });
    }
    
    // Configurar o botão de aplicar filtros
    const botaoAplicarFiltros = document.getElementById('applyFilters');
    if (botaoAplicarFiltros) {
        botaoAplicarFiltros.addEventListener('click', function() {
            conteudoFiltro.classList.remove('show');
            executarBusca();
        });
    }
    
    // Configuração do modal de detalhes
    const modalDetalhesLivro = document.getElementById('bookDetailModal');
    const botaoFecharModal = document.querySelector('.close-modal');
    
    if (botaoFecharModal && modalDetalhesLivro) {
        botaoFecharModal.addEventListener('click', function() {
            modalDetalhesLivro.style.display = 'none';
        });
        
        // Fechar o modal ao clicar fora dele
        window.addEventListener('click', function(e) {
            if (e.target === modalDetalhesLivro) {
                modalDetalhesLivro.style.display = 'none';
            }
        });
    }
    
    // Carregar a chave da API do Gemini se estiver disponível
    if (window.StorageManager && typeof window.StorageManager.getApiKey === 'function') {
        const chaveApiGemini = window.StorageManager.getApiKey();
        if (chaveApiGemini && window.GeminiAPI && typeof window.GeminiAPI.init === 'function') {
            window.GeminiAPI.init(chaveApiGemini);
            
            const campoChaveApi = document.getElementById('geminiApiKey');
            if (campoChaveApi) {
                campoChaveApi.value = chaveApiGemini;
            }
        }
    }
    
    // Popular a lista de histórico ao carregar
    popularListaHistorico();
});

// Função para realizar a busca
async function executarBusca() {
    console.log("Iniciando busca...");
    
    const indicadorCarregamento = document.getElementById('loading');
    if (indicadorCarregamento) {
        indicadorCarregamento.style.display = 'flex';
    }
    
    const listaResultados = document.getElementById('resultsList');
    if (listaResultados) {
        listaResultados.innerHTML = '';
    }
    
    const containerResultados = document.getElementById('results');
    if (containerResultados) {
        containerResultados.style.display = 'none';
    }
    
    const campoBuscaPrincipal = document.getElementById('searchInput');
    if (!campoBuscaPrincipal || campoBuscaPrincipal.value.trim() === '') {
        if (indicadorCarregamento) {
            indicadorCarregamento.style.display = 'none';
        }
        return;
    }
    
    const termoBusca = campoBuscaPrincipal.value.trim();
    console.log("Termo de busca:", termoBusca);
    
    if (window.StorageManager && typeof window.StorageManager.addToHistory === 'function') {
        window.StorageManager.addToHistory(termoBusca);
        popularListaHistorico();
    }
    
    const tituloHabilitado = document.getElementById('titleField')?.checked ?? true;
    const autorHabilitado = document.getElementById('authorField')?.checked ?? true;
    const editoraHabilitado = document.getElementById('publisherField')?.checked ?? false;
    const assuntoHabilitado = document.getElementById('subjectField')?.checked ?? false;
    
    let ordenarPor = 'relevance';
    if (document.getElementById('newestSort')?.checked) ordenarPor = 'newest';
    if (document.getElementById('titleSort')?.checked) ordenarPor = 'title';
    if (document.getElementById('authorSort')?.checked) ordenarPor = 'author';
    
    const usarGeminiParaDescricao = document.getElementById('useGemini')?.checked ?? false;
    
    try {
        if (usarGeminiParaDescricao && window.GeminiAPI && typeof window.GeminiAPI.getSearchDescription === 'function') {
            const elementoDescricaoBusca = document.getElementById('searchDescription');
            if (elementoDescricaoBusca) {
                elementoDescricaoBusca.textContent = 'Gerando descrição...';
                elementoDescricaoBusca.style.display = 'block';
                
                try {
                    const descricaoGerada = await window.GeminiAPI.getSearchDescription(termoBusca);
                    elementoDescricaoBusca.textContent = descricaoGerada;
                } catch (erro) {
                    console.error('Erro ao gerar descrição da busca:', erro);
                    elementoDescricaoBusca.textContent = `Resultados para "${termoBusca}"`;
                }
            }
        } else {
            const elementoDescricaoBusca = document.getElementById('searchDescription');
            if (elementoDescricaoBusca) {
                elementoDescricaoBusca.textContent = `Resultados para "${termoBusca}"`;
                elementoDescricaoBusca.style.display = 'block';
            }
        }
        
        let resultadosDaBusca = null;
        
        if (window.searchBooks && typeof window.searchBooks === 'function') {
            console.log("Usando API externa para busca");
            try {
                const resultadoApi = await window.searchBooks(termoBusca, {
                    fields: {
                        title: tituloHabilitado,
                        author: autorHabilitado,
                        publisher: editoraHabilitado,
                        subject: assuntoHabilitado
                    },
                    sort: ordenarPor
                });
                
                console.log("Resultado da API externa:", resultadoApi);
                
                if (resultadoApi && resultadoApi.success && resultadoApi.books && resultadoApi.books.length > 0) {
                    resultadosDaBusca = {
                        items: resultadoApi.books,
                        totalItems: resultadoApi.count
                    };
                    console.log("Resultados convertidos da API externa:", resultadosDaBusca);
                }
            } catch (e) {
                console.error('Erro na API externa:', e);
            }
        }
        
        if (!resultadosDaBusca) {
            console.log("Usando implementação local de busca");
            resultadosDaBusca = await buscarLivrosGoogle(termoBusca, {
                tituloHabilitado,
                autorHabilitado,
                editoraHabilitado,
                assuntoHabilitado,
                ordenarPor
            });
            console.log("Resultados da implementação local:", resultadosDaBusca);
        }
        
        if (resultadosDaBusca && resultadosDaBusca.items && resultadosDaBusca.items.length > 0) {
            console.log(`Exibindo ${resultadosDaBusca.items.length} resultados`);
            exibirResultados(resultadosDaBusca, usarGeminiParaDescricao);
            
            if (containerResultados) {
                containerResultados.style.display = 'block';
            }
        } else {
            console.log("Nenhum resultado encontrado");
            
            if (listaResultados) {
                listaResultados.innerHTML = '<div class="no-results">Nenhum resultado encontrado para esta busca.</div>';
            }
            
            if (containerResultados) {
                containerResultados.style.display = 'block';
            }
        }
        
    } catch (erro) {
        console.error('Erro na busca:', erro);
        
        if (listaResultados) {
            listaResultados.innerHTML = `<div class="error-message">Não foi possível realizar a busca. Por favor, tente novamente mais tarde.</div>`;
        }
        
        if (containerResultados) {
            containerResultados.style.display = 'block';
        }
    } finally {
        if (indicadorCarregamento) {
            indicadorCarregamento.style.display = 'none';
        }
    }
}

// Função para exibir os resultados na lista
async function exibirResultados(dadosResultados, usarGeminiParaGerarDescricao = false) {
    const elementoListaResultados = document.getElementById('resultsList');
    const containerResultadosBusca = document.getElementById('search-results-container');
    const modalDetalhesLivro = document.getElementById('bookDetailModal');

    if (!elementoListaResultados || !containerResultadosBusca || !modalDetalhesLivro) {
        console.error('Elementos do DOM não encontrados para exibir resultados.');
        return;
    }

    elementoListaResultados.innerHTML = '';

    let contadorDescricaoGerada = 0;

    for (const item of dadosResultados.items) {
        const infoLivro = item.volumeInfo || item;

        const cardLivro = document.createElement('div');
        cardLivro.classList.add('book-card');
        cardLivro.dataset.bookId = item.id || (infoLivro.industryIdentifiers ? infoLivro.industryIdentifiers[0].identifier : Date.now() + Math.random());

        const elementoTitulo = document.createElement('h3');
        elementoTitulo.textContent = infoLivro.title || 'Título não disponível';
        cardLivro.appendChild(elementoTitulo);

        if (infoLivro.authors && infoLivro.authors.length > 0) {
            const elementoAutores = document.createElement('p');
            elementoAutores.innerHTML = `<strong>Autor(es):</strong> ${infoLivro.authors.join(', ')}`;
            cardLivro.appendChild(elementoAutores);
        }

        const urlCapa = infoLivro.imageLinks?.thumbnail || infoLivro.cover_url_m || infoLivro.cover?.medium || 'img/placeholder.png';
        const elementoImg = document.createElement('img');
        elementoImg.src = urlCapa;
        elementoImg.alt = `Capa de ${infoLivro.title || 'livro'}`;
        elementoImg.onerror = function() { this.src = 'img/placeholder.png'; };
        cardLivro.appendChild(elementoImg);

        const elementoDescricao = document.createElement('p');
        elementoDescricao.classList.add('book-description');
        const idDescricao = `desc-${cardLivro.dataset.bookId}-${contadorDescricaoGerada++}`;
        elementoDescricao.id = idDescricao;

        if (usarGeminiParaGerarDescricao && window.GeminiAPI && typeof window.GeminiAPI.generateBookDescription === 'function') {
            elementoDescricao.textContent = 'Gerando descrição com IA...';
            cardLivro.appendChild(elementoDescricao);

            window.GeminiAPI.generateBookDescription(infoLivro.title, infoLivro.authors ? infoLivro.authors.join(', ') : '')
                .then(descricao => {
                    const elementoDescricaoAlvo = document.getElementById(idDescricao);
                    if (elementoDescricaoAlvo) elementoDescricaoAlvo.textContent = descricao || 'Não foi possível gerar uma descrição.';
                })
                .catch(erro => {
                    console.error('Erro ao gerar descrição com Gemini:', erro);
                    const elementoDescricaoAlvo = document.getElementById(idDescricao);
                    if (elementoDescricaoAlvo) {
                        elementoDescricaoAlvo.textContent = infoLivro.description ? (infoLivro.description.substring(0, 150) + '...') : 'Descrição não disponível.';
                    }
                });
        } else {
            elementoDescricao.textContent = infoLivro.description ? (infoLivro.description.substring(0, 150) + '...') : 'Descrição não disponível.';
            cardLivro.appendChild(elementoDescricao);
        }

        const botaoDetalhes = document.createElement('button');
        botaoDetalhes.classList.add('details-btn');
        botaoDetalhes.textContent = 'Ver Detalhes';
        botaoDetalhes.addEventListener('click', () => exibirDetalhesLivro(infoLivro));
        cardLivro.appendChild(botaoDetalhes);

        elementoListaResultados.appendChild(cardLivro);
    }

    // Rolar para a seção de resultados
    // containerResultadosBusca.scrollIntoView({ behavior: 'smooth' });
}

// Função para exibir detalhes do livro no modal
function exibirDetalhesLivro(dadosLivro) {
    const modalDetalhesLivro = document.getElementById('bookDetailModal');
    const tituloModal = document.getElementById('modalTitle');
    const autoresModal = document.getElementById('modalAuthors');
    const descricaoModal = document.getElementById('modalDescription');
    const capaModal = document.getElementById('modalCover');
    const editoraModal = document.getElementById('modalPublisher');
    const dataPublicacaoModal = document.getElementById('modalPublishedDate');
    const numPaginasModal = document.getElementById('modalPageCount');
    const categoriasModal = document.getElementById('modalCategories');
    const idiomaModal = document.getElementById('modalLanguage');
    const isbnModal = document.getElementById('modalIsbn');
    const linkPreviaModal = document.getElementById('modalPreviewLink');
    const linkInfoModal = document.getElementById('modalInfoLink');
    const linkCompraModal = document.getElementById('modalBuyLink');
    const containerResumoGemini = document.getElementById('geminiSummaryContainer');
    const resumoGemini = document.getElementById('geminiSummary');
    const botaoGerarResumo = document.getElementById('generateSummaryBtn');

    if (!modalDetalhesLivro || !tituloModal || !autoresModal || !descricaoModal || !capaModal ||
        !editoraModal || !dataPublicacaoModal || !numPaginasModal || !categoriasModal ||
        !idiomaModal || !isbnModal || !linkPreviaModal || !linkInfoModal || !linkCompraModal ||
        !containerResumoGemini || !resumoGemini || !botaoGerarResumo) {
        console.error('Elementos do modal não encontrados.');
        return;
    }

    const infoVolume = dadosLivro.volumeInfo || dadosLivro;

    tituloModal.textContent = infoVolume.title || 'Título não disponível';
    autoresModal.textContent = infoVolume.authors ? `Autor(es): ${infoVolume.authors.join(', ')}` : 'Autor não disponível';
    descricaoModal.textContent = infoVolume.description || 'Descrição não disponível.';
    
    const urlImagemCapa = infoVolume.imageLinks?.thumbnail || infoVolume.cover_url_m || infoVolume.cover?.medium || 'img/placeholder.png';
    capaModal.src = urlImagemCapa;
    capaModal.alt = `Capa de ${infoVolume.title || 'livro'}`;
    capaModal.onerror = function() { this.src = 'img/placeholder.png'; };

    editoraModal.textContent = infoVolume.publisher ? `Editora: ${infoVolume.publisher}` : 'Editora não disponível';
    dataPublicacaoModal.textContent = infoVolume.publishedDate ? `Data de Publicação: ${infoVolume.publishedDate}` : 'Data de publicação não disponível';
    numPaginasModal.textContent = infoVolume.pageCount ? `Número de Páginas: ${infoVolume.pageCount}` : 'Número de páginas não disponível';
    categoriasModal.textContent = infoVolume.categories ? `Categorias: ${infoVolume.categories.join(', ')}` : 'Categorias não disponíveis';
    idiomaModal.textContent = infoVolume.language ? `Idioma: ${infoVolume.language}` : 'Idioma não disponível';

    let textoIsbn = 'ISBN não disponível';
    if (infoVolume.industryIdentifiers) {
        const isbn13 = infoVolume.industryIdentifiers.find(id => id.type === 'ISBN_13');
        const isbn10 = infoVolume.industryIdentifiers.find(id => id.type === 'ISBN_10');
        if (isbn13) textoIsbn = `ISBN-13: ${isbn13.identifier}`;
        else if (isbn10) textoIsbn = `ISBN-10: ${isbn10.identifier}`;
    }
    isbnModal.textContent = textoIsbn;

    linkPreviaModal.href = infoVolume.previewLink || '#';
    linkPreviaModal.style.display = infoVolume.previewLink ? 'inline-block' : 'none';
    linkInfoModal.href = infoVolume.infoLink || '#';
    linkInfoModal.style.display = infoVolume.infoLink ? 'inline-block' : 'none';
    
    const infoVenda = dadosLivro.saleInfo || {};
    linkCompraModal.href = infoVenda.buyLink || '#';
    linkCompraModal.style.display = infoVenda.buyLink ? 'inline-block' : 'none';

    resumoGemini.textContent = '';
    containerResumoGemini.style.display = 'none';

    if (window.GeminiAPI && typeof window.GeminiAPI.summarizeBook === 'function') {
        botaoGerarResumo.style.display = 'block';
        botaoGerarResumo.onclick = async () => {
            resumoGemini.textContent = 'Gerando resumo com IA...';
            containerResumoGemini.style.display = 'block';
            try {
                const resumoGerado = await window.GeminiAPI.summarizeBook(infoVolume.title, infoVolume.authors ? infoVolume.authors.join(', ') : '', infoVolume.description);
                resumoGemini.textContent = resumoGerado || 'Não foi possível gerar um resumo.';
            } catch (erro) {
                console.error('Erro ao gerar resumo com Gemini:', erro);
                resumoGemini.textContent = 'Erro ao gerar resumo. Tente novamente.';
            }
        };
    } else {
        botaoGerarResumo.style.display = 'none';
    }

    modalDetalhesLivro.style.display = 'block';
}

// Função para buscar livros na API do Google Books
async function buscarLivrosGoogle(termoConsulta, opcoes = {}) {
    const {
        usarTitulo = true,
        usarAutor = true,
        usarEditora = false,
        usarAssunto = false,
        ordenacao = 'relevance',
        maximoResultados = 20,
        indiceInicial = 0
    } = opcoes;

    let partesConsulta = [];
    if (usarTitulo) partesConsulta.push(`intitle:${termoConsulta}`);
    if (usarAutor) partesConsulta.push(`inauthor:${termoConsulta}`);
    if (usarEditora) partesConsulta.push(`inpublisher:${termoConsulta}`);
    if (usarAssunto) partesConsulta.push(`subject:${termoConsulta}`);

    let consultaFinal = termoConsulta;
    
    let consultasEspecificas = [];
    if (usarTitulo) consultasEspecificas.push(`intitle:${termoConsulta}`);
    if (usarAutor) consultasEspecificas.push(`inauthor:${termoConsulta}`);
    if (usarEditora) consultasEspecificas.push(`inpublisher:${termoConsulta}`);
    if (usarAssunto) consultasEspecificas.push(`subject:${termoConsulta}`);
    
    if (consultasEspecificas.length > 0) {
      consultaFinal = consultasEspecificas.join('+');
    } else {
      consultaFinal = termoConsulta;
    }

    const urlApi = new URL('https://www.googleapis.com/books/v1/volumes');
    urlApi.searchParams.append('q', consultaFinal);
    urlApi.searchParams.append('orderBy', ordenacao);
    urlApi.searchParams.append('maxResults', String(maximoResultados));
    urlApi.searchParams.append('startIndex', String(indiceInicial));

    console.log("URL da API Google Books:", urlApi.toString());

    try {
        const resposta = await fetch(urlApi.toString());
        if (!resposta.ok) {
            const dadosErro = await resposta.json().catch(() => ({ message: resposta.statusText }));
            console.error('Erro na API do Google Books:', resposta.status, dadosErro);
            throw new Error(`Erro ${resposta.status} ao buscar no Google Books: ${dadosErro.message || 'Erro desconhecido'}`);
        }
        const dados = await resposta.json();
        console.log("Dados recebidos do Google Books:", dados);
        return dados;
    } catch (erro) {
        console.error('Falha ao buscar livros no Google Books:', erro);
        return { items: [], totalItems: 0, error: erro.message };
    }
}

// Função de exemplo para buscar no Open Library
async function buscarOpenLibrary(termoConsulta) {
    const urlApi = new URL('https://openlibrary.org/search.json');
    urlApi.searchParams.append('q', termoConsulta);

    console.log("URL da API Open Library:", urlApi.toString());

    try {
        const resposta = await fetch(urlApi.toString());
        if (!resposta.ok) {
            throw new Error(`Erro ${resposta.status} ao buscar no Open Library`);
        }
        const dados = await resposta.json();
        console.log("Dados recebidos do Open Library:", dados);
        return {
            items: dados.docs.map(documento => ({
                id: documento.key,
                volumeInfo: {
                    title: documento.title,
                    authors: documento.author_name,
                    publishedDate: documento.first_publish_year,
                }
            })),
            totalItems: dados.numFound
        };
    } catch (erro) {
        console.error('Falha ao buscar livros na Open Library:', erro);
        return { items: [], totalItems: 0, error: erro.message };
    }
}

// Função para popular a lista de histórico
function popularListaHistorico() {
    if (window.StorageManager && typeof window.StorageManager.getHistory === 'function') {
        const historico = window.StorageManager.getHistory();
        const elementoListaHistorico = document.getElementById('searchHistoryList');
        
        if (elementoListaHistorico) {
            elementoListaHistorico.innerHTML = '';
            historico.forEach(termo => {
                const itemLista = document.createElement('li');
                itemLista.textContent = termo;
                itemLista.addEventListener('click', () => {
                    const campoBuscaPrincipal = document.getElementById('searchInput');
                    if (campoBuscaPrincipal) {
                        campoBuscaPrincipal.value = termo;
                        executarBusca();
                    }
                });
                elementoListaHistorico.appendChild(itemLista);
            });
        }
    }
}

// Exemplo de como exportar funções se este script fosse um módulo (não é o caso aqui)
// export { executarBusca, exibirResultados, exibirDetalhesLivro }; 
