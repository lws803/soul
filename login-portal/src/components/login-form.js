import {
  Box,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  FormErrorMessage,
  Button,
  Center,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQueryParam, StringParam } from 'use-query-params';

export default function LoginForm() {
  const [callback] = useQueryParam('callback', StringParam);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: (values) => {
      alert(JSON.stringify(values, null, 2));
      // If login is successful
      window.open(callback, '_blank');
    },
    validationSchema: Yup.object({
      email: Yup.string().email().required(),
      password: Yup.string().required(),
    }),
    validateOnChange: false,
  });

  return (
    <Center>
      <Box p={8} width={500}>
        <form onSubmit={formik.handleSubmit}>
          <FormControl isInvalid={formik.errors.email && formik.touched.email}>
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
            isInvalid={formik.errors.password && formik.touched.password}
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
          <Button mt={4} colorScheme="teal" type="submit">
            Login
          </Button>
        </form>
      </Box>
    </Center>
  );
}
