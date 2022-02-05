import { ChakraProvider } from '@chakra-ui/react';

import FormWrapper from './components/form-wrapper';
import './style';

export default function App() {
  return (
    <ChakraProvider>
      <FormWrapper />
    </ChakraProvider>
  );
}
