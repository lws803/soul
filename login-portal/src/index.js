import { ChakraProvider } from '@chakra-ui/react';

import './style';

export default function App() {
  return (
    <ChakraProvider>
      <div>
        <h1>Hello, World!</h1>
      </div>
    </ChakraProvider>
  );
}
