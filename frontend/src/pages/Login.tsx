import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';

const Login = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'cadastro'>('login');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, cadastrar } = useAuth();

  // Login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  // Cadastro
  const [dadosCadastro, setDadosCadastro] = useState({
    nome: '',
    email: '',
    telefoneCelular: '',
    dataNascimento: '',
    cpf: '',
    senha: '',
    confirmarSenha: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(emailLogin, senhaLogin);
      showToast('Login realizado com sucesso!', 'success');
      navigate('/');
    } catch (error: any) {
      showToast(error.message || 'Erro ao fazer login', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dadosCadastro.senha !== dadosCadastro.confirmarSenha) {
      showToast('As senhas não coincidem', 'error');
      return;
    }

    if (dadosCadastro.senha.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    setLoading(true);

    try {
      await cadastrar({
        nome: dadosCadastro.nome,
        email: dadosCadastro.email,
        telefoneCelular: dadosCadastro.telefoneCelular,
        dataNascimento: dadosCadastro.dataNascimento,
        cpf: dadosCadastro.cpf || undefined,
        senha: dadosCadastro.senha,
      });
      showToast('Cadastro realizado com sucesso!', 'success');
      navigate('/');
    } catch (error: any) {
      showToast(error.message || 'Erro ao cadastrar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Header>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k as 'login' | 'cadastro')}
                className="mb-0"
              >
                <Tab eventKey="login" title="Login">
                  <div className="mt-3">
                    <Form onSubmit={handleLogin}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email *</Form.Label>
                        <Form.Control
                          type="email"
                          required
                          value={emailLogin}
                          onChange={(e) => setEmailLogin(e.target.value)}
                          placeholder="seu@email.com"
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Senha</Form.Label>
                        <Form.Control
                          type="password"
                          value={senhaLogin}
                          onChange={(e) => setSenhaLogin(e.target.value)}
                          placeholder="Opcional (para futuras implementações)"
                        />
                        <Form.Text className="text-muted">
                          Por enquanto, apenas o email é necessário
                        </Form.Text>
                      </Form.Group>

                      <Button
                        type="submit"
                        variant="primary"
                        className="w-100"
                        disabled={loading}
                      >
                        {loading ? 'Entrando...' : 'Entrar'}
                      </Button>
                    </Form>
                  </div>
                </Tab>

                <Tab eventKey="cadastro" title="Cadastre-se">
                  <div className="mt-3">
                    <Form onSubmit={handleCadastro}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nome Completo *</Form.Label>
                        <Form.Control
                          type="text"
                          required
                          value={dadosCadastro.nome}
                          onChange={(e) =>
                            setDadosCadastro({ ...dadosCadastro, nome: e.target.value })
                          }
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Email *</Form.Label>
                        <Form.Control
                          type="email"
                          required
                          value={dadosCadastro.email}
                          onChange={(e) =>
                            setDadosCadastro({ ...dadosCadastro, email: e.target.value })
                          }
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Telefone Celular *</Form.Label>
                        <Form.Control
                          type="tel"
                          required
                          value={dadosCadastro.telefoneCelular}
                          onChange={(e) =>
                            setDadosCadastro({
                              ...dadosCadastro,
                              telefoneCelular: e.target.value,
                            })
                          }
                        />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Data de Nascimento *</Form.Label>
                            <Form.Control
                              type="date"
                              required
                              value={dadosCadastro.dataNascimento}
                              onChange={(e) =>
                                setDadosCadastro({
                                  ...dadosCadastro,
                                  dataNascimento: e.target.value,
                                })
                              }
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>CPF</Form.Label>
                            <Form.Control
                              type="text"
                              value={dadosCadastro.cpf}
                              onChange={(e) =>
                                setDadosCadastro({ ...dadosCadastro, cpf: e.target.value })
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Senha *</Form.Label>
                        <Form.Control
                          type="password"
                          required
                          value={dadosCadastro.senha}
                          onChange={(e) =>
                            setDadosCadastro({ ...dadosCadastro, senha: e.target.value })
                          }
                          minLength={6}
                        />
                        <Form.Text className="text-muted">
                          Mínimo de 6 caracteres
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Confirmar Senha *</Form.Label>
                        <Form.Control
                          type="password"
                          required
                          value={dadosCadastro.confirmarSenha}
                          onChange={(e) =>
                            setDadosCadastro({
                              ...dadosCadastro,
                              confirmarSenha: e.target.value,
                            })
                          }
                        />
                      </Form.Group>

                      <Button
                        type="submit"
                        variant="success"
                        className="w-100"
                        disabled={loading}
                      >
                        {loading ? 'Cadastrando...' : 'Cadastrar'}
                      </Button>
                    </Form>
                  </div>
                </Tab>
              </Tabs>
            </Card.Header>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
