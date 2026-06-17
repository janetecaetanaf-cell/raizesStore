import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiLogOut, FiPackage, FiUsers, FiBarChart2 } from 'react-icons/fi';
import { useCarrinho } from '../context/CarrinhoContext';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';
import AnnouncementBar from './AnnouncementBar';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { itens } = useCarrinho();
  const { usuario, estaAutenticado, isAdmin, logout } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const totalItensCarrinho = itens.reduce((acc, item) => acc + item.quantidade, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {!isAdminRoute && <AnnouncementBar />}
      <BootstrapNavbar expand="lg" className="store-navbar sticky-top">
        <Container>
          <BootstrapNavbar.Brand as={Link} to="/" state={{ reset: true }} className="store-brand">
            <img
              src="/images/logo-raizes-circulo.png"
              alt="Raízes Estampas"
              className="brand-logo"
            />
            <span className="brand-text">
              <strong>Raízes</strong>
              <small>Estampas</small>
            </span>
          </BootstrapNavbar.Brand>

          <BootstrapNavbar.Toggle aria-controls="store-navbar" />

          <BootstrapNavbar.Collapse id="store-navbar">
            <Nav className="mx-auto store-nav-links">
              {!isAdminRoute ? (
                <>
                  <Nav.Link as={Link} to="/" state={{ reset: true }}>Início</Nav.Link>
                  <NavDropdown title="Produtos" id="nav-produtos">
                    <NavDropdown.Item as={Link} to="/#destaques">Ver catálogo</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/#destaques">Camisetas</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/#destaques">Canecas</NavDropdown.Item>
                  </NavDropdown>
                  <NavDropdown title="Personalização" id="nav-personalizados">
                    <NavDropdown.Item as={Link} to="/atendimento">Crie sua estampa</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/atendimento">Pedidos especiais</NavDropdown.Item>
                  </NavDropdown>
                  <Nav.Link as={Link} to="/nossa-historia">Nossa História</Nav.Link>
                  <Nav.Link as={Link} to="/atendimento">Atendimento</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/admin">
                    <Icon icon={FiBarChart2} className="me-1" /> Dashboard
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/produtos">
                    <Icon icon={FiPackage} className="me-1" /> Produtos
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/pedidos">
                    <Icon icon={FiShoppingCart} className="me-1" /> Pedidos
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/clientes">
                    <Icon icon={FiUsers} className="me-1" /> Clientes
                  </Nav.Link>
                  <Nav.Link as={Link} to="/" className="nav-link-loja">Loja</Nav.Link>
                </>
              )}
            </Nav>

            <Nav className="store-nav-actions align-items-center">
              {!isAdminRoute && (
                <Nav.Link as={Link} to="/carrinho" className="cart-link position-relative">
                  <Icon icon={FiShoppingCart} size={22} />
                  {totalItensCarrinho > 0 && (
                    <span className="cart-badge">{totalItensCarrinho}</span>
                  )}
                </Nav.Link>
              )}
              {estaAutenticado ? (
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center gap-1">
                      <Icon icon={FiUser} size={18} />
                      {usuario?.nome?.split(' ')[0] || 'Conta'}
                    </span>
                  }
                  id="user-dropdown"
                  align="end"
                >
                  {isAdmin && (
                    <NavDropdown.Item as={Link} to="/admin">
                      <Icon icon={FiBarChart2} className="me-2" /> Admin
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Item onClick={handleLogout}>
                    <Icon icon={FiLogOut} className="me-2" /> Sair
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Nav.Link as={Link} to="/login" className="login-link">
                  <Icon icon={FiUser} size={18} className="me-1" />
                  Entrar
                </Nav.Link>
              )}
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>
    </>
  );
};

export default Navbar;
