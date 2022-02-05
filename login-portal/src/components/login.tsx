import {
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  FormErrorMessage,
  Button,
  HStack,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

export default function Login({
  setError,
  setFormState,
  platformId,
  callback,
}: Props) {
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: (values) => {
      setError(undefined);
      axios
        .post(
          `http://localhost:3000/v1/auth/code?platformId=${platformId}&callback=${callback}`,
          values,
        )
        .then(({ data }) => {
          if (data.code) {
            if (typeof window !== 'undefined') {
              window.open(`https://${callback}?code=${data.code}`, '_blank');
            }
          }
        })
        .catch(({ response: { data, status } }) => {
          if (status === 404) {
            if (data.error === 'USER_NOT_FOUND') {
              setFormState('register');
            }
            if (data.error === 'PLATFORM_USER_NOT_FOUND') {
              setFormState('join-platform');
            }
          } else {
            setError(data.message);
          }
        });

      if (typeof window !== 'undefined') {
        // window.open(`https://${callback}`, '_blank');
      }
    },
    validationSchema: Yup.object({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    }),
    validateOnChange: false,
  });

  return (
    <form onSubmit={(e) => formik.handleSubmit(e as any)}>
      <FormControl isInvalid={!!formik.errors.email && formik.touched.email}>
        <FormLabel htmlFor="email">Email</FormLabel>
        <Input
          id="email"
          name="email"
          onChange={formik.handleChange}
          value={formik.values.email}
        />
        {!formik.errors.email && (
          <FormHelperText>We'll never share your email.</FormHelperText>
        )}
        {formik.errors.email && (
          <FormErrorMessage>{formik.errors.email}</FormErrorMessage>
        )}
      </FormControl>

      <FormControl
        isInvalid={!!formik.errors.password && formik.touched.password}
        marginTop={8}
      >
        <FormLabel htmlFor="password">Password</FormLabel>
        <Input
          id="password"
          name="password"
          type="password"
          onChange={formik.handleChange}
          value={formik.values.password}
        />
        {formik.errors.password && (
          <FormErrorMessage>{formik.errors.password}</FormErrorMessage>
        )}
      </FormControl>
      <HStack mt={8}>
        <Button colorScheme="teal" type="submit">
          Login
        </Button>
        <Button colorScheme="teal" onClick={() => setFormState('register')}>
          Register
        </Button>
      </HStack>
    </form>
  );
}

type Props = {
  setError: (error: string | undefined) => void;
  setFormState: (state: 'login' | 'register' | 'join-platform') => void;
  platformId: number;
  callback: string;
};
