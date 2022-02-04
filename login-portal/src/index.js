import { ChakraProvider } from '@chakra-ui/react';
import { QueryParamProvider } from 'use-query-params';

import './style';
import LoginForm from './components/login-form';

export default function App() {
  return (
    <QueryParamProvider>
      <ChakraProvider>
        <LoginForm />
      </ChakraProvider>
    </QueryParamProvider>
  );
}
