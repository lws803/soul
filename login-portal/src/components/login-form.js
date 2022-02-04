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
import axios from 'axios';

export default function LoginForm() {
  const { callback, platformId } = useQueryParams();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: (values) => {
      axios
        .post(
          `http://localhost:3000/v1/auth/code?platformId=${platformId}&callback=${callback}`,
          values,
        )
        .then((data) => console.log(data))
        .catch((error) => console.log(error));

      if (typeof window !== 'undefined') {
        // window.open(`https://${callback}`, '_blank');
      }
      // TODO: If user has not signed up before then we will need to open up registration form
      // TODO: If user has not joined the platform before, we will need to open up the join page
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

const useQueryParams = () => {
  const result = {};
  const search = typeof window !== 'undefined' ? window.location.search : '';
  new URLSearchParams(search).forEach((value, key) => {
    result[key] = value;
  });
  return result;
};
