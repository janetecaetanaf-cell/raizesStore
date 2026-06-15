using Microsoft.EntityFrameworkCore;
using RaizesStore.Domain.Entities;

namespace RaizesStore.Infrastructure.Data;

public static class DbSeeder
{
    private static readonly string[] CategoriasLegado = new[]
    {
        "Velas e Incensos",
        "Guias e Fios",
        "Imagens e Quadros",
        "Kits Ritualísticos",
        "Camisetas Religiosas",
    };

    private static readonly string[] ProdutosLegado = new[]
    {
        "Caneca Oxalá — Paz e Luz",
        "Kit Velas 7 Dias — Linha Completa",
        "Camiseta Oxóssi — Caçador",
        "Guia de Contas — 7 Linhas",
        "Kit Ofertas Básicas — Iemanjá",
        "Caneca Iemanjá — Rainha do Mar",
        "Imagem Pomba Gira — Quadro 20x30",
        "Defumador com Ervas Sagradas",
        "Camiseta Casamento — Noivos",
    };

    private static readonly (string Nome, string Descricao, decimal Preco, string Categoria, TipoProduto Tipo, int Estoque,
        List<TamanhoProduto>? Tamanhos, List<CorProduto>? Cores, string ImagemSlug)[] Catalogo = new[]
    {
        ("Caneca Motivacional — Frase do Dia",
            "Caneca 325ml com frase inspiradora personalizada. Ideal para presentear ou usar no dia a dia.",
            39.90m, "Canecas", TipoProduto.Caneca, 12, null,
            new List<CorProduto> { CorProduto.Branco, CorProduto.Preto, CorProduto.Bege }, "caneca-motivacional"),

        ("Camiseta Sua Ideia Aqui",
            "Camiseta 100% algodão totalmente personalizável. Nome, frase, logo, foto ou qualquer estampa — sua ideia estampada aqui.",
            64.90m, "Camisetas", TipoProduto.Camiseta, 20,
            new List<TamanhoProduto> { TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG },
            new List<CorProduto> { CorProduto.Branco, CorProduto.Preto, CorProduto.Rosa }, "sua-ideia"),

        ("Camiseta Banda de Rock — Estampa Vintage",
            "Camiseta com estampa estilo vintage. Perfeita para fãs de música e colecionadores.",
            64.90m, "Camisetas", TipoProduto.Camiseta, 15,
            new List<TamanhoProduto> { TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG },
            new List<CorProduto> { CorProduto.Preto, CorProduto.Branco }, "camiseta-rock"),

        ("Caneca Empresa — Logo Corporativo",
            "Caneca com logo e identidade visual da sua empresa. Ótima para brindes e eventos.",
            34.90m, "Canecas", TipoProduto.Caneca, 30, null,
            new List<CorProduto> { CorProduto.Branco, CorProduto.Preto }, "caneca-empresa"),

        ("Camiseta Noivado — Ela Disse Sim",
            "Camiseta para celebrar o noivado. Nomes do casal, data do pedido e frase especial — ideal para chá bar, festa de noivado ou foto a dois.",
            69.90m, "Camisetas", TipoProduto.Camiseta, 12,
            new List<TamanhoProduto> { TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG },
            new List<CorProduto> { CorProduto.Branco, CorProduto.Rosa }, "noivado"),

        ("Caneca Dia dos Namorados — Te Amo",
            "Caneca 325ml romântica para presentear no Dia dos Namorados. Nome do casal, foto ou mensagem de amor personalizada.",
            42.90m, "Canecas", TipoProduto.Caneca, 15, null,
            new List<CorProduto> { CorProduto.Branco, CorProduto.Vermelho, CorProduto.Rosa }, "caneca-namorados"),

        ("Caneca Frases — Sua Frase Aqui",
            "Caneca 325ml com a frase que você quiser. Exemplo: \"Menos reação e mais ação...\" — motivação, humor, amizade ou qualquer texto.",
            39.90m, "Canecas", TipoProduto.Caneca, 20, null,
            new List<CorProduto> { CorProduto.Branco, CorProduto.Preto }, "caneca-frases"),

        ("Caneca Pet — Amor de Cachorro",
            "Caneca com foto e nome do seu pet. Presente perfeito para amantes de animais.",
            39.90m, "Canecas", TipoProduto.Caneca, 10, null,
            new List<CorProduto> { CorProduto.Branco, CorProduto.Azul }, "caneca-pet"),

        ("Camiseta Brasil — Seleção",
            "Camiseta amarela da Seleção Brasileira com estampa BRASIL. Personalize com nome e número.",
            59.90m, "Camisetas", TipoProduto.Camiseta, 6,
            new List<TamanhoProduto> { TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG, TamanhoProduto.XG },
            new List<CorProduto> { CorProduto.Amarelo, CorProduto.Verde, CorProduto.Branco }, "camiseta-brasil"),

        ("Caneca Geek — Gamer Life",
            "Caneca com estampas geek, games e frases divertidas. Para gamers e fãs de cultura pop.",
            39.90m, "Canecas", TipoProduto.Caneca, 25, null,
            new List<CorProduto> { CorProduto.Preto, CorProduto.Branco }, "caneca-geek"),

        ("Camiseta Aurora Boreal — Árvore Mística",
            "Camiseta com estampa de aurora boreal e árvore sob céu estrelado. Visual místico e impactante.",
            69.90m, "Camisetas", TipoProduto.Camiseta, 10,
            new List<TamanhoProduto> { TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG },
            new List<CorProduto> { CorProduto.Preto }, "camiseta-aurora"),
    };

    private static readonly HashSet<string> NomesCatalogoSeed = new(
        Catalogo.Select(c => c.Nome),
        StringComparer.Ordinal);

    public static async Task SeedAsync(RaizesStoreDbContext context)
    {
        await NormalizarCategoriasAsync(context);
        await RenomearCamisetaBrasilAsync(context);
        await RenomearCamisetaSuaIdeiaAsync(context);
        await RemoverCatalogoLegadoAsync(context);
        await GarantirCategoriasAsync(context);
        await GarantirProdutosAsync(context);
        await AtualizarImagensCamisetasAsync(context);
        await AtualizarImagensCanecaEmpresaAsync(context);
        await AtualizarImagensCanecasEspeciaisAsync(context);
    }

    private static async Task RenomearCamisetaSuaIdeiaAsync(RaizesStoreDbContext context)
    {
        const string nomeAntigo = "Camiseta Aniversário — Festa Personalizada";
        const string nomeNovo = "Camiseta Sua Ideia Aqui";
        const string descricaoNova =
            "Camiseta 100% algodão totalmente personalizável. Nome, frase, logo, foto ou qualquer estampa — sua ideia estampada aqui.";

        var produto = await context.Produtos
            .FirstOrDefaultAsync(p => p.DeletedAt == null && p.Nome == nomeAntigo);

        if (produto == null)
            return;

        produto.Atualizar(nomeNovo, descricaoNova, produto.Preco, produto.CategoriaId, produto.Ativo, produto.Estoque);

        produto.Imagens.Clear();
        produto.LimparImagensPorCor();
        ConfigurarImagensCamiseta(produto, "sua-ideia");

        await context.SaveChangesAsync();
    }

    private static async Task RenomearCamisetaBrasilAsync(RaizesStoreDbContext context)
    {
        const string nomeAntigo = "Camiseta Time — Torcida Organizada";
        const string nomeNovo = "Camiseta Brasil — Seleção";
        const string descricaoNova =
            "Camiseta amarela da Seleção Brasileira com estampa BRASIL. Personalize com nome e número.";

        var produto = await context.Produtos
            .FirstOrDefaultAsync(p => p.DeletedAt == null && p.Nome == nomeAntigo);

        if (produto == null)
            return;

        produto.Atualizar(nomeNovo, descricaoNova, produto.Preco, produto.CategoriaId, produto.Ativo, produto.Estoque);

        foreach (var cor in produto.CoresDisponiveis.ToList())
            produto.RemoverCor(cor);

        produto.AdicionarCor(CorProduto.Amarelo);
        produto.AdicionarCor(CorProduto.Verde);
        produto.AdicionarCor(CorProduto.Branco);

        await context.SaveChangesAsync();
    }

    private static async Task NormalizarCategoriasAsync(RaizesStoreDbContext context)
    {
        var categorias = await context.Categorias
            .Where(c => c.DeletedAt == null)
            .ToListAsync();

        var alterou = false;

        var camisetasReligiosas = categorias.FirstOrDefault(c => c.Nome == "Camisetas Religiosas");
        var camisetas = categorias.FirstOrDefault(c => c.Nome == "Camisetas");

        if (camisetasReligiosas != null)
        {
            if (camisetas == null)
            {
                camisetasReligiosas.Atualizar("Camisetas", "Camisetas personalizadas com estampas exclusivas", true);
            }
            else
            {
                var produtosAntigos = await context.Produtos
                    .Where(p => p.CategoriaId == camisetasReligiosas.Id && p.DeletedAt == null)
                    .ToListAsync();

                foreach (var produto in produtosAntigos)
                {
                    produto.Atualizar(produto.Nome, produto.Descricao, produto.Preco, camisetas.Id, produto.Ativo, produto.Estoque);
                }

                camisetasReligiosas.Delete();
            }

            alterou = true;
        }

        var duplicatasCamisetas = categorias
            .Where(c => c.Nome == "Camisetas" && c.Id != camisetas?.Id && c.DeletedAt == null)
            .ToList();

        if (camisetas != null)
        {
            foreach (var duplicata in duplicatasCamisetas)
            {
                var produtosDuplicados = await context.Produtos
                    .Where(p => p.CategoriaId == duplicata.Id && p.DeletedAt == null)
                    .ToListAsync();

                foreach (var produto in produtosDuplicados)
                {
                    produto.Atualizar(produto.Nome, produto.Descricao, produto.Preco, camisetas.Id, produto.Ativo, produto.Estoque);
                }

                duplicata.Delete();
                alterou = true;
            }
        }

        foreach (var nome in CategoriasLegado.Where(n => n != "Camisetas Religiosas"))
        {
            var categoria = categorias.FirstOrDefault(c => c.Nome == nome);
            if (categoria == null)
                continue;

            var produtos = await context.Produtos
                .Where(p => p.CategoriaId == categoria.Id && p.DeletedAt == null)
                .ToListAsync();

            foreach (var produto in produtos)
                produto.Delete();

            categoria.Delete();
            alterou = true;
        }

        var camisetasAtual = categorias.FirstOrDefault(c => c.Nome == "Camisetas" && c.DeletedAt == null);
        if (camisetasAtual != null)
        {
            camisetasAtual.Atualizar("Camisetas", "Camisetas personalizadas com estampas exclusivas", true);
            alterou = true;
        }

        var canecas = categorias.FirstOrDefault(c => c.Nome == "Canecas" && c.DeletedAt == null);
        if (canecas != null)
        {
            canecas.Atualizar("Canecas", "Canecas personalizadas para qualquer ocasião", true);
            alterou = true;
        }

        if (alterou)
            await context.SaveChangesAsync();
    }

    private static async Task RemoverCatalogoLegadoAsync(RaizesStoreDbContext context)
    {
        var produtos = await context.Produtos
            .Where(p => p.DeletedAt == null && ProdutosLegado.Contains(p.Nome))
            .ToListAsync();

        if (produtos.Count == 0)
            return;

        foreach (var produto in produtos)
            produto.Delete();

        await context.SaveChangesAsync();
    }

    private static async Task GarantirCategoriasAsync(RaizesStoreDbContext context)
    {
        var nomesExistentes = await context.Categorias
            .Where(c => c.DeletedAt == null)
            .Select(c => c.Nome)
            .ToListAsync();

        var novas = new List<Categoria>();
        var ordem = nomesExistentes.Count + 1;

        foreach (var item in Catalogo.Select(c => c.Categoria).Distinct())
        {
            if (nomesExistentes.Contains(item))
                continue;

            var descricao = item switch
            {
                "Camisetas" => "Camisetas personalizadas com estampas exclusivas",
                "Canecas" => "Canecas personalizadas para qualquer ocasião",
                _ => $"Produtos de {item}",
            };

            var cat = new Categoria(item, descricao);
            cat.DefinirOrdem(ordem++);
            novas.Add(cat);
        }

        if (novas.Count > 0)
        {
            context.Categorias.AddRange(novas);
            await context.SaveChangesAsync();
        }
    }

    private static async Task GarantirProdutosAsync(RaizesStoreDbContext context)
    {
        var nomesAtivos = await context.Produtos
            .Where(p => p.DeletedAt == null)
            .Select(p => p.Nome)
            .ToListAsync();

        var nomesExcluidos = await context.Produtos
            .Where(p => p.DeletedAt != null)
            .Select(p => p.Nome)
            .Distinct()
            .ToListAsync();

        var categorias = await context.Categorias
            .Where(c => c.DeletedAt == null)
            .GroupBy(c => c.Nome)
            .Select(g => g.OrderBy(c => c.CreatedAt).First())
            .ToDictionaryAsync(c => c.Nome, c => c.Id);
        var novos = new List<Produto>();

        foreach (var item in Catalogo)
        {
            if (nomesAtivos.Contains(item.Nome) || nomesExcluidos.Contains(item.Nome))
                continue;

            if (!categorias.TryGetValue(item.Categoria, out var categoriaId))
                continue;

            var produto = new Produto(item.Nome, item.Descricao, item.Preco, categoriaId, item.Tipo);
            produto.AtualizarEstoque(item.Estoque);

            if (item.Tamanhos != null)
            {
                foreach (var t in item.Tamanhos)
                    produto.AdicionarTamanho(t);
            }

            if (item.Cores != null)
            {
                foreach (var c in item.Cores)
                    produto.AdicionarCor(c);
            }

            if (item.Tipo == TipoProduto.Camiseta)
                ConfigurarImagensCamiseta(produto, item.ImagemSlug);
            else if (item.ImagemSlug == "caneca-empresa")
                ConfigurarImagensCanecaEmpresa(produto);
            else if (item.ImagemSlug == "caneca-namorados")
                ConfigurarImagensCanecaNamorados(produto);
            else if (item.ImagemSlug == "caneca-frases")
                ConfigurarImagensCanecaFrases(produto);
            else if (item.ImagemSlug == "caneca-geek")
                ConfigurarImagensCanecaGeek(produto);
            else if (item.ImagemSlug == "caneca-pet")
                ConfigurarImagensCanecaPet(produto);
            else if (item.ImagemSlug == "camiseta-aurora")
                ConfigurarImagensAurora(produto);
            else
                produto.AdicionarImagem(Img(item.ImagemSlug));

            novos.Add(produto);
        }

        if (novos.Count > 0)
        {
            context.Produtos.AddRange(novos);
            await context.SaveChangesAsync();
        }
    }

    private static async Task AtualizarImagensCamisetasAsync(RaizesStoreDbContext context)
    {
        var produtos = await context.Produtos
            .Where(p => p.DeletedAt == null && p.TipoProduto == TipoProduto.Camiseta)
            .ToListAsync();

        var alterou = false;
        foreach (var produto in produtos)
        {
            if (!NomesCatalogoSeed.Contains(produto.Nome))
                continue;

            if (CamisetaImagensAtualizadas(produto))
                continue;

            produto.Imagens.Clear();
            produto.LimparImagensPorCor();
            ConfigurarImagensCamiseta(produto);
            alterou = true;
        }

        if (alterou)
            await context.SaveChangesAsync();
    }

    private static void ConfigurarImagensAurora(Produto produto)
    {
        const string preta = "/images/produtos/camiseta-aurora-preta.png";
        const string estampa = "/images/produtos/camiseta-aurora-estampa.png";

        produto.AdicionarImagem(preta);
        produto.AdicionarImagem(estampa);
        produto.DefinirImagemCor(CorProduto.Preto, preta);
    }

    private static void ConfigurarImagensCamiseta(Produto produto, string? slug = null)
    {
        if (slug == "camiseta-aurora" || ResolverTemaCamiseta(produto.Nome) == "aurora")
        {
            produto.Imagens.Clear();
            produto.LimparImagensPorCor();
            ConfigurarImagensAurora(produto);
            return;
        }

        var tema = slug ?? ResolverTemaCamiseta(produto.Nome);
        var cores = produto.CoresDisponiveis.Count > 0
            ? produto.CoresDisponiveis
            : new List<CorProduto> { CorPadraoTema(tema) };

        var imagensAdicionadas = new HashSet<string>();
        foreach (var cor in cores)
        {
            var imagem = ImgCamiseta(tema, cor);
            produto.DefinirImagemCor(cor, imagem);
            if (imagensAdicionadas.Add(imagem))
                produto.AdicionarImagem(imagem);
        }

        if (produto.Imagens.Count == 0)
            produto.AdicionarImagem(ImgCamiseta(tema, CorPadraoTema(tema)));
    }

    private static string ResolverTemaCamiseta(string nome)
    {
        if (nome.Contains("Sua Ideia", StringComparison.OrdinalIgnoreCase)) return "sua-ideia";
        if (nome.Contains("Motivacional", StringComparison.OrdinalIgnoreCase)) return "motivacao";
        if (nome.Contains("Rock", StringComparison.OrdinalIgnoreCase)) return "rock";
        if (nome.Contains("Casamento", StringComparison.OrdinalIgnoreCase)) return "casamento";
        if (nome.Contains("Noivado", StringComparison.OrdinalIgnoreCase)) return "noivado";
        if (nome.Contains("Brasil", StringComparison.OrdinalIgnoreCase)
            || nome.Contains("Seleção", StringComparison.OrdinalIgnoreCase)
            || nome.Contains("Time", StringComparison.OrdinalIgnoreCase)) return "brasil";
        if (nome.Contains("Aurora", StringComparison.OrdinalIgnoreCase)) return "aurora";
        return "sua-ideia";
    }

    private static CorProduto CorPadraoTema(string tema) => tema switch
    {
        "rock" => CorProduto.Preto,
        "casamento" => CorProduto.Bege,
        "brasil" => CorProduto.Amarelo,
        "motivacao" => CorProduto.Branco,
        _ => CorProduto.Branco,
    };

    private static bool CamisetaImagensAtualizadas(Produto produto)
    {
        if (produto.Imagens.Count == 0)
            return false;

        var tema = ResolverTemaCamiseta(produto.Nome);
        var prefixo = $"camiseta-{tema}-";
        var extensao = ExtensaoTema(tema);
        return produto.Imagens.All(i =>
            i.Contains(prefixo, StringComparison.OrdinalIgnoreCase)
            && i.Contains($".{extensao}", StringComparison.OrdinalIgnoreCase));
    }

    private static string ExtensaoTema(string tema) => tema switch
    {
        "rock" or "brasil" or "aurora" or "sua-ideia" or "noivado" => "png",
        _ => "svg",
    };

    private static string ImgCamiseta(string tema, CorProduto cor)
    {
        var slug = SlugCor(cor, tema);
        return $"/images/produtos/camiseta-{tema}-{slug}.{ExtensaoTema(tema)}";
    }

    private static string SlugCor(CorProduto cor, string tema)
    {
        var slug = cor switch
        {
            CorProduto.Preto => "preta",
            CorProduto.Verde => "verde",
            CorProduto.Amarelo => "amarela",
            CorProduto.Rosa => "rosa",
            CorProduto.Bege => "bege",
            _ => "branca",
        };

        if (tema == "brasil" && slug == "preta")
            return "amarela";

        return slug;
    }

    private static async Task AtualizarImagensCanecaEmpresaAsync(RaizesStoreDbContext context)
    {
        const string nomeProduto = "Caneca Empresa — Logo Corporativo";
        var produto = await context.Produtos
            .FirstOrDefaultAsync(p => p.DeletedAt == null && p.Nome == nomeProduto);

        if (produto == null)
            return;

        if (CanecaEmpresaImagensCorretas(produto))
            return;

        produto.Imagens.Clear();
        produto.LimparImagensPorCor();
        ConfigurarImagensCanecaEmpresa(produto);
        await context.SaveChangesAsync();
    }

    private static bool CanecaEmpresaImagensCorretas(Produto produto)
    {
        const string branca = "/images/produtos/caneca-empresa-branca.png";
        const string preta = "/images/produtos/caneca-empresa-preta.png";

        return produto.Imagens.Count == 2
            && produto.Imagens.Contains(branca)
            && produto.Imagens.Contains(preta)
            && produto.ImagensPorCor.GetValueOrDefault(CorProduto.Branco) == branca
            && produto.ImagensPorCor.GetValueOrDefault(CorProduto.Preto) == preta;
    }

    private static void ConfigurarImagensCanecaEmpresa(Produto produto)
    {
        const string branca = "/images/produtos/caneca-empresa-branca.png";
        const string preta = "/images/produtos/caneca-empresa-preta.png";

        produto.AdicionarImagem(branca);
        produto.AdicionarImagem(preta);
        produto.DefinirImagemCor(CorProduto.Branco, branca);
        produto.DefinirImagemCor(CorProduto.Preto, preta);
    }

    private static async Task AtualizarImagensCanecasEspeciaisAsync(RaizesStoreDbContext context)
    {
        var alterou = false;

        var namorados = await context.Produtos
            .FirstOrDefaultAsync(p => p.DeletedAt == null && p.Nome == "Caneca Dia dos Namorados — Te Amo");
        if (namorados != null && !CanecaNamoradosImagensCorretas(namorados))
        {
            namorados.Imagens.Clear();
            namorados.LimparImagensPorCor();
            ConfigurarImagensCanecaNamorados(namorados);
            alterou = true;
        }

        var frases = await context.Produtos
            .FirstOrDefaultAsync(p => p.DeletedAt == null && p.Nome == "Caneca Frases — Sua Frase Aqui");
        if (frases != null && !CanecaFrasesImagensCorretas(frases))
        {
            frases.Imagens.Clear();
            frases.LimparImagensPorCor();
            ConfigurarImagensCanecaFrases(frases);
            alterou = true;
        }

        var motivacional = await context.Produtos
            .FirstOrDefaultAsync(p => p.DeletedAt == null && p.Nome == "Caneca Motivacional — Frase do Dia");
        if (motivacional != null && !CanecaFrasesImagensCorretas(motivacional))
        {
            motivacional.Imagens.Clear();
            motivacional.LimparImagensPorCor();
            ConfigurarImagensCanecaFrases(motivacional);
            alterou = true;
        }

        var geek = await context.Produtos
            .FirstOrDefaultAsync(p => p.DeletedAt == null && p.Nome == "Caneca Geek — Gamer Life");
        if (geek != null && !CanecaGeekImagensCorretas(geek))
        {
            geek.Imagens.Clear();
            geek.LimparImagensPorCor();
            ConfigurarImagensCanecaGeek(geek);
            alterou = true;
        }

        var pet = await context.Produtos
            .FirstOrDefaultAsync(p => p.DeletedAt == null && p.Nome == "Caneca Pet — Amor de Cachorro");
        if (pet != null && !CanecaPetImagensCorretas(pet))
        {
            pet.Imagens.Clear();
            pet.LimparImagensPorCor();
            ConfigurarImagensCanecaPet(pet);
            alterou = true;
        }

        if (alterou)
            await context.SaveChangesAsync();
    }

    private static bool CanecaNamoradosImagensCorretas(Produto produto)
    {
        const string branca = "/images/produtos/caneca-namorados-branca.png";
        const string vermelha = "/images/produtos/caneca-namorados-vermelha.png";

        return produto.Imagens.Count >= 2
            && produto.Imagens.Contains(branca)
            && produto.Imagens.Contains(vermelha);
    }

    private static bool CanecaFrasesImagensCorretas(Produto produto)
    {
        const string branca = "/images/produtos/caneca-frases-branca.png";
        const string preta = "/images/produtos/caneca-frases-preta.png";

        return produto.Imagens.Count >= 2
            && produto.Imagens.Contains(branca)
            && produto.Imagens.Contains(preta);
    }

    private static void ConfigurarImagensCanecaNamorados(Produto produto)
    {
        const string branca = "/images/produtos/caneca-namorados-branca.png";
        const string vermelha = "/images/produtos/caneca-namorados-vermelha.png";

        produto.AdicionarImagem(branca);
        produto.AdicionarImagem(vermelha);
        produto.DefinirImagemCor(CorProduto.Branco, branca);
        produto.DefinirImagemCor(CorProduto.Vermelho, vermelha);
        produto.DefinirImagemCor(CorProduto.Rosa, branca);
    }

    private static void ConfigurarImagensCanecaFrases(Produto produto)
    {
        const string branca = "/images/produtos/caneca-frases-branca.png";
        const string preta = "/images/produtos/caneca-frases-preta.png";

        produto.AdicionarImagem(branca);
        produto.AdicionarImagem(preta);
        produto.DefinirImagemCor(CorProduto.Branco, branca);
        produto.DefinirImagemCor(CorProduto.Preto, preta);
    }

    private static bool CanecaGeekImagensCorretas(Produto produto)
    {
        const string branca = "/images/produtos/caneca-geek-branca.png";
        const string preta = "/images/produtos/caneca-geek-preta.png";

        return produto.Imagens.Count >= 2
            && produto.Imagens.Contains(branca)
            && produto.Imagens.Contains(preta);
    }

    private static void ConfigurarImagensCanecaGeek(Produto produto)
    {
        const string branca = "/images/produtos/caneca-geek-branca.png";
        const string preta = "/images/produtos/caneca-geek-preta.png";

        produto.AdicionarImagem(branca);
        produto.AdicionarImagem(preta);
        produto.DefinirImagemCor(CorProduto.Branco, branca);
        produto.DefinirImagemCor(CorProduto.Preto, preta);
    }

    private static bool CanecaPetImagensCorretas(Produto produto)
    {
        const string branca = "/images/produtos/caneca-pet-branca.png";
        const string azul = "/images/produtos/caneca-pet-azul.png";

        return produto.Imagens.Count >= 2
            && produto.Imagens.Contains(branca)
            && produto.Imagens.Contains(azul);
    }

    private static void ConfigurarImagensCanecaPet(Produto produto)
    {
        const string branca = "/images/produtos/caneca-pet-branca.png";
        const string azul = "/images/produtos/caneca-pet-azul.png";

        produto.AdicionarImagem(branca);
        produto.AdicionarImagem(azul);
        produto.DefinirImagemCor(CorProduto.Branco, branca);
        produto.DefinirImagemCor(CorProduto.Azul, azul);
    }

    private static string Img(string slug) => slug switch
    {
        "caneca-empresa" => "/images/produtos/caneca-empresa-branca.png",
        "caneca-namorados" => "/images/produtos/caneca-namorados-branca.png",
        "caneca-frases" => "/images/produtos/caneca-frases-branca.png",
        "caneca-geek" => "/images/produtos/caneca-geek-preta.png",
        "caneca-pet" => "/images/produtos/caneca-pet-branca.png",
        "caneca-motivacional"
            => "/images/produtos/caneca-frases-branca.png",
        _ => "/images/produtos/caneca-frases-branca.png",
    };
}
