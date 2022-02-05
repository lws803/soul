import { useState } from 'preact/hooks';
import { Box, Center, Text } from '@chakra-ui/react';

import Login from './login';
import Register from './register';

export default function FormWrapper() {
  const { callback, platformId } = useQueryParams();
  const [error, setError] = useState();
  const [formState, setFormState] = useState('login');

  return (
    <Center>
      <Box p={8} width={500}>
        {formState === 'login' ? (
          <Login
            setError={setError}
            setFormState={setFormState}
            callback={callback}
            platformId={platformId}
          />
        ) : formState === 'register' ? (
          <Register />
        ) : (
          <div>join platform</div>
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
