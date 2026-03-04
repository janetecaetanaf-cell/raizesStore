import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CarrinhoProvider } from './context/CarrinhoContext';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import ProdutoDetalhes from './pages/ProdutoDetalhes';
import Carrinho from './pages/Carrinho';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminProdutos from './pages/Admin/Produtos';
import AdminPedidos from './pages/Admin/Pedidos';
import AdminClientes from './pages/Admin/Clientes';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <Router>
          <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-grow-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/produto/:id" element={<ProdutoDetalhes />} />
                <Route path="/carrinho" element={<Carrinho />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/produtos" element={<AdminProdutos />} />
                <Route path="/admin/pedidos" element={<AdminPedidos />} />
                <Route path="/admin/clientes" element={<AdminClientes />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CarrinhoProvider>
    </AuthProvider>
  );
}

export default App;
