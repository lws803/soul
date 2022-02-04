import { ChakraProvider } from '@chakra-ui/react';

import './style';
import LoginForm from './components/login-form';

export default function App() {
  return (
    <ChakraProvider>
      <LoginForm />
    </ChakraProvider>
  );
}
