using Microsoft.EntityFrameworkCore;
using RaizesStore.Domain.Entities;

namespace RaizesStore.Infrastructure.Data;

public static class DbSeeder
{
    private static readonly (string Nome, string Descricao, decimal Preco, string Categoria, TipoProduto Tipo, int Estoque,
        List<TamanhoProduto>? Tamanhos, List<CorProduto>? Cores, string ImagemSlug)[] Catalogo =
    {
        ("Caneca Oxalá — Paz e Luz",
            "Caneca 325ml com arte exclusiva de Oxalá. Ideal para presentear ou usar no dia a dia com axé.",
            39.90m, "Canecas", TipoProduto.Caneca, 12, null,
            new List<CorProduto> { CorProduto.Branco, CorProduto.Azul, CorProduto.Bege }, "caneca-oxala"),

        ("Kit Velas 7 Dias — Linha Completa",
            "Conjunto com 7 velas coloridas para trabalhos espirituais. Feito com carinho e intenção.",
            59.90m, "Velas e Incensos", TipoProduto.Vela, 20, null, null, "velas-7-dias"),

        ("Camiseta Oxóssi — Caçador",
            "Camiseta 100% algodão com estampa de Oxóssi. Personalização disponível.",
            64.90m, "Camisetas", TipoProduto.Camiseta, 15,
            new List<TamanhoProduto> { TamanhoProduto.P, TamanhoProduto.M, TamanhoProduto.G, TamanhoProduto.GG },
            new List<CorProduto> { CorProduto.Branco, CorProduto.Preto, CorProduto.Verde }, "camiseta-oxossi"),

        ("Guia de Contas — 7 Linhas",
            "Guia tradicional com contas coloridas. Produzido artesanalmente com respeito à tradição.",
            34.90m, "Guias e Fios", TipoProduto.Guia, 30, null, null, "guia-contas"),

        ("Kit Ofertas Básicas — Iemanjá",
            "Kit com flores, conchas, velas azuis e incenso. Perfeito para homenagear Iemanjá.",
            69.90m, "Velas e Incensos", TipoProduto.Vela, 8, null, null, "kit-iemanja"),

        ("Caneca Iemanjá — Rainha do Mar",
            "Caneca com arte de Iemanjá em tons de azul e branco. 325ml, cerâmica premium.",
            39.90m, "Canecas", TipoProduto.Caneca, 10, null,
            new List<CorProduto> { CorProduto.Branco, CorProduto.Azul }, "caneca-iemanja"),

        ("Imagem Pomba Gira — Quadro 20x30",
            "Quadro em MDF com imagem de Pomba Gira. Acabamento artesanal, pronto para pendurar.",
            44.90m, "Imagens e Quadros", TipoProduto.ImagemQuadro, 6, null, null, "quadro-pomba-gira"),

            ("Defumador com Ervas Sagradas",
            "Defumador de cerâmica com mix de ervas: arruda, guiné, alecrim e manjericão.",
            24.90m, "Velas e Incensos", TipoProduto.Defumador, 25, null, null, "defumador-ervas"),
    };

    public static async Task SeedAsync(RaizesStoreDbContext context)
    {
        await NormalizarCategoriasAsync(context);
        await GarantirCategoriasAsync(context);
        await GarantirProdutosAsync(context);
        await AtualizarImagensPersonalizadasAsync(context);
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
                camisetasReligiosas.Atualizar("Camisetas", "Camisetas espirituais personalizadas", true);
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

        var kits = categorias.FirstOrDefault(c => c.Nome == "Kits Ritualísticos");
        if (kits != null)
        {
            var destino = categorias.FirstOrDefault(c => c.Nome == "Velas e Incensos")
                ?? categorias.FirstOrDefault(c => c.Nome != "Kits Ritualísticos");

            if (destino != null)
            {
                var produtosKits = await context.Produtos
                    .Where(p => p.CategoriaId == kits.Id && p.DeletedAt == null)
                    .ToListAsync();

                foreach (var produto in produtosKits)
                {
                    produto.Atualizar(produto.Nome, produto.Descricao, produto.Preco, destino.Id, produto.Ativo, produto.Estoque);
                }
            }

            kits.Delete();
            alterou = true;
        }

        if (alterou)
            await context.SaveChangesAsync();
    }

    private static async Task GarantirCategoriasAsync(RaizesStoreDbContext context)
    {
        var nomesExistentes = await context.Categorias
            .Select(c => c.Nome)
            .ToListAsync();

        var novas = new List<Categoria>();
        var ordem = nomesExistentes.Count + 1;

        foreach (var item in Catalogo.Select(c => c.Categoria).Distinct())
        {
            if (nomesExistentes.Contains(item))
                continue;

            var cat = new Categoria(item, $"Produtos de {item}");
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
        var nomesExistentes = await context.Produtos
            .Where(p => p.DeletedAt == null)
            .Select(p => p.Nome)
            .ToListAsync();

        var categorias = await context.Categorias
            .Where(c => c.DeletedAt == null)
            .GroupBy(c => c.Nome)
            .Select(g => g.OrderBy(c => c.CreatedAt).First())
            .ToDictionaryAsync(c => c.Nome, c => c.Id);
        var novos = new List<Produto>();

        foreach (var item in Catalogo)
        {
            if (nomesExistentes.Contains(item.Nome))
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

            if (item.ImagemSlug == "camiseta-oxossi")
            {
                ConfigurarImagensCamisetaOxossi(produto);
            }
            else
            {
                produto.AdicionarImagem(Img(item.ImagemSlug));
            }

            novos.Add(produto);
        }

        if (novos.Count > 0)
        {
            context.Produtos.AddRange(novos);
            await context.SaveChangesAsync();
        }
    }

    private static async Task AtualizarImagensPersonalizadasAsync(RaizesStoreDbContext context)
    {
        var slugsPersonalizados = new HashSet<string> { "caneca-oxala", "caneca-iemanja" };
        var imagensPorNome = Catalogo
            .Where(c => slugsPersonalizados.Contains(c.ImagemSlug))
            .ToDictionary(c => c.Nome, c => Img(c.ImagemSlug));
        var produtos = await context.Produtos
            .Where(p => p.DeletedAt == null)
            .ToListAsync();

        var alterou = false;
        foreach (var produto in produtos)
        {
            if (produto.Nome == "Camiseta Oxóssi — Caçador")
            {
                if (CamisetaOxossiConfigurada(produto))
                    continue;

                produto.Imagens.Clear();
                produto.LimparImagensPorCor();
                ConfigurarImagensCamisetaOxossi(produto);
                alterou = true;
                continue;
            }

            if (!imagensPorNome.TryGetValue(produto.Nome, out var imagem))
                continue;

            if (produto.Imagens.Count == 1 && produto.Imagens[0] == imagem)
                continue;

            produto.Imagens.Clear();
            produto.AdicionarImagem(imagem);
            alterou = true;
        }

        if (alterou)
            await context.SaveChangesAsync();
    }

    private static void ConfigurarImagensCamisetaOxossi(Produto produto)
    {
        const string branco = "/images/produtos/camiseta-oxossi.png";
        const string preto = "/images/produtos/camiseta-oxossi-preto.png";
        const string verde = "/images/produtos/camiseta-oxossi-verde.png";

        produto.AdicionarImagem(branco);
        produto.AdicionarImagem(preto);
        produto.AdicionarImagem(verde);
        produto.DefinirImagemCor(CorProduto.Branco, branco);
        produto.DefinirImagemCor(CorProduto.Preto, preto);
        produto.DefinirImagemCor(CorProduto.Verde, verde);
    }

    private static bool CamisetaOxossiConfigurada(Produto produto)
    {
        var branco = "/images/produtos/camiseta-oxossi.png";
        var preto = "/images/produtos/camiseta-oxossi-preto.png";
        var verde = "/images/produtos/camiseta-oxossi-verde.png";

        return produto.Imagens.Contains(branco)
            && produto.Imagens.Contains(preto)
            && produto.Imagens.Contains(verde)
            && produto.ImagensPorCor.GetValueOrDefault(CorProduto.Branco) == branco
            && produto.ImagensPorCor.GetValueOrDefault(CorProduto.Preto) == preto
            && produto.ImagensPorCor.GetValueOrDefault(CorProduto.Verde) == verde;
    }

    private static string Img(string slug) => slug switch
    {
        "caneca-oxala" => "/images/produtos/caneca-oxala.png",
        "caneca-iemanja" => "/images/produtos/caneca-iemanja.png",
        "camiseta-oxossi" => "/images/produtos/camiseta-oxossi.png",
        "velas-7-dias" or "defumador-ervas" => "https://images.unsplash.com/photo-1602874801006-c0979f52a516?w=600&h=600&fit=crop",
        "guia-contas" => "https://images.unsplash.com/photo-1610701596007-115028ae2fee?w=600&h=600&fit=crop",
        "kit-iemanja" => "https://images.unsplash.com/photo-1490750967868-88aa4486cfe7?w=600&h=600&fit=crop",
        "quadro-pomba-gira" => "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=600&fit=crop",
        _ => "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop",
    };
}
