import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import NossaHistoria from './pages/NossaHistoria';
import Atendimento from './pages/Atendimento';
import PagamentoStatus from './pages/PagamentoStatus';
import Pagamento from './pages/Pagamento';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function AppContent() {
  const location = useLocation();
  const showWhatsApp = !location.pathname.startsWith('/admin');

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/produto/:id" element={<ProdutoDetalhes />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/login" element={<Login />} />
          <Route path="/nossa-historia" element={<NossaHistoria />} />
          <Route path="/atendimento" element={<Atendimento />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/pagamento/pagar" element={<Pagamento />} />
          <Route path="/pagamento/sucesso" element={<PagamentoStatus variant="sucesso" />} />
          <Route path="/pagamento/pendente" element={<PagamentoStatus variant="pendente" />} />
          <Route path="/pagamento/falha" element={<PagamentoStatus variant="falha" />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/produtos" element={<AdminRoute><AdminProdutos /></AdminRoute>} />
          <Route path="/admin/pedidos" element={<AdminRoute><AdminPedidos /></AdminRoute>} />
          <Route path="/admin/clientes" element={<AdminRoute><AdminClientes /></AdminRoute>} />
        </Routes>
      </main>
      <Footer />
      {showWhatsApp && <WhatsAppButton />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CarrinhoProvider>
        <Router>
          <AppContent />
        </Router>
      </CarrinhoProvider>
    </AuthProvider>
  );
}

export default App;
