import { Navbar as BootstrapNavbar, Nav, Container, NavbarBrand, NavDropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiHome, FiPackage, FiUsers, FiBarChart2, FiUser, FiLogOut } from 'react-icons/fi';
import { useCarrinho } from '../context/CarrinhoContext';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { itens } = useCarrinho();
  const { usuario, estaAutenticado, logout } = useAuth();
  const isAdmin = location.pathname.startsWith('/admin');
  const totalItensCarrinho = itens.reduce((acc, item) => acc + item.quantidade, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <BootstrapNavbar expand="lg" className="navbar navbar-expand-lg navbar-light bg-light sticky-top" style={{ position: 'relative', zIndex: 999 }}>
        <Container>
          <NavbarBrand as={Link} to="/" className="logo-container">
            <img src="/raizes-logo.png" alt="Raizes Impressões Criativas" className="logo-svg" />
          </NavbarBrand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {!isAdmin ? (
              <>
                <Nav.Link as={Link} to="/" className="d-flex align-items-center gap-2">
                  <Icon icon={FiHome} /> Produtos
                </Nav.Link>
                <Nav.Link as={Link} to="/carrinho" className="d-flex align-items-center gap-2 position-relative">
                  <Icon icon={FiShoppingCart} />
                  Carrinho
                  {totalItensCarrinho > 0 && (
                    <span className="badge bg-danger rounded-pill position-absolute top-0 start-100 translate-middle">
                      {totalItensCarrinho}
                    </span>
                  )}
                </Nav.Link>
                {estaAutenticado ? (
                  <NavDropdown title={usuario?.nome || 'Minha Conta'} id="user-dropdown">
                    <NavDropdown.Item as={Link} to="/admin">
                      <Icon icon={FiBarChart2} className="me-2" />
                      Admin
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      <Icon icon={FiLogOut} className="me-2" />
                      Sair
                    </NavDropdown.Item>
                  </NavDropdown>
                ) : (
                  <Nav.Link as={Link} to="/login" className="btn btn-outline-primary btn-sm ms-2">
                    <Icon icon={FiUser} className="me-1" />
                    Entrar
                  </Nav.Link>
                )}
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/admin" className="d-flex align-items-center gap-2">
                  <Icon icon={FiBarChart2} /> Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/produtos" className="d-flex align-items-center gap-2">
                  <Icon icon={FiPackage} /> Produtos
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/pedidos" className="d-flex align-items-center gap-2">
                  <Icon icon={FiShoppingCart} /> Pedidos
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/clientes" className="d-flex align-items-center gap-2">
                  <Icon icon={FiUsers} /> Clientes
                </Nav.Link>
                <Nav.Link as={Link} to="/" className="btn btn-outline-primary btn-sm ms-2">
                  Loja
                </Nav.Link>
                {estaAutenticado && (
                  <NavDropdown title={usuario?.nome || 'Conta'} id="admin-user-dropdown" className="ms-2">
                    <NavDropdown.Item onClick={handleLogout}>
                      <Icon icon={FiLogOut} className="me-2" />
                      Sair
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
    </>
  );
};

export default Navbar;
