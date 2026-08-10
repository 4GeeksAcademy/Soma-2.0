const TOKEN_KEY = "soma_token";
const USUARIO_KEY = "soma_usuario";

const leerSesionGuardada = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const usuarioRaw = localStorage.getItem(USUARIO_KEY);
    if (!token || !usuarioRaw) return { token: null, usuario: null };
    return { token, usuario: JSON.parse(usuarioRaw) };
  } catch {
    return { token: null, usuario: null };
  }
};

export const initialStore=()=>{
  const { token, usuario } = leerSesionGuardada();
  return{
    message: null,
    token,
    usuario,
    todos: [
      {
        id: 1,
        title: "Make the bed",
        background: null
      },
      {
        id: 2,
        title: "Do my homework",
        background: null
      }
    ]
  };
};

export default function storeReducer(store, action = {}) {
  switch(action.type){
    case 'set_hello':
      return {
        ...store,
        message: action.payload
      };

    // payload: { token, usuario } -- login exitoso o cambio de password completado
    case 'set_auth': {
      const { token, usuario } = action.payload;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
      return { ...store, token, usuario };
    }

    case 'logout': {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USUARIO_KEY);
      return { ...store, token: null, usuario: null };
    }

    case 'add_task':

      const { id,  color } = action.payload;

      return {
        ...store,
        todos: store.todos.map((todo) => (todo.id === id ? { ...todo, background: color } : todo))
      };
    default:
      throw Error('Unknown action.');
  }
}
