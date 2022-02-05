import { useState } from 'preact/hooks';
import { Box, Center, Text } from '@chakra-ui/react';

import Login from './login';

export default function FormWrapper() {
  const { callback, platformId } = useQueryParams();
  const [error, setError] = useState();
  const [loginState, setLoginState] = useState('login');

  return (
    <Center>
      <Box p={8} width={500}>
        {loginState === 'login' && (
          <Login
            setError={setError}
            setLoginState={setLoginState}
            callback={callback}
            platformId={platformId}
          />
        )}
        {error && (
          <Text marginTop={8} textColor="red.600" fontSize="lg">
            {error}
          </Text>
        )}
      </Box>
    </Center>
  );
}

const useQueryParams = () => {
  const result = {};
  const search = typeof window !== 'undefined' ? window.location.search : '';
  new URLSearchParams(search).forEach((value, key) => {
    result[key] = value;
  });
  return result;
};
