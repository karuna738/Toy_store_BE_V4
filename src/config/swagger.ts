export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ToyVerse E-Commerce API',
    version: '1.0.0',
    description: 'Production Node.js TypeScript Express Backend with MySQL for ToyVerse e-commerce application.'
  },
  servers: [
    {
      url: '/api',
      description: 'Default API Endpoint'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT Bearer token obtained from /api/auth/login'
      }
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string', example: 'Operation completed successfully' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane@example.com' },
          phone: { type: 'string', example: '9876543210' },
          address: { type: 'string', example: '12 Lake View Road, Chennai' },
          role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'], example: 'CUSTOMER' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          code: { type: 'string', example: 'TOY-101' },
          name: { type: 'string', example: 'Turbo Racing Car' },
          category: { type: 'string', example: 'Cars & RC' },
          price: { type: 'number', example: 1299 },
          oldPrice: { type: 'number', nullable: true, example: 1699 },
          discount: { type: 'number', example: 24 },
          stock: { type: 'integer', example: 40 },
          rating: { type: 'number', example: 4.8 },
          reviews: { type: 'integer', example: 234 },
          description: { type: 'string' },
          image: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          section: { type: 'string', enum: ['regular', 'trending', 'new', 'handmade', 'bestseller', 'coming-soon'] },
          badge: { type: 'string', example: 'BEST SELLER' }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1' },
          orderNumber: { type: 'string', example: 'ORD-1001' },
          user: { type: 'string', example: '2' },
          customerName: { type: 'string', example: 'Demo Customer' },
          customerEmail: { type: 'string', example: 'customer@toyverse.demo' },
          phone: { type: 'string', example: '9876543210' },
          address: { type: 'string' },
          subtotal: { type: 'number', example: 1299 },
          deliveryCharge: { type: 'number', example: 0 },
          totalAmount: { type: 'number', example: 1299 },
          status: { type: 'string', enum: ['Pending', 'Dispatched', 'Delivered', 'Not Available', 'Cancelled', 'Returned'] },
          stockDeducted: { type: 'boolean', example: true }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check probe',
        tags: ['System'],
        responses: {
          200: { description: 'Server and database status' }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register customer account',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'password'],
                properties: {
                  name: { type: 'string', example: 'Jane Doe' },
                  email: { type: 'string', example: 'jane@example.com' },
                  phone: { type: 'string', example: '9876543210' },
                  password: { type: 'string', example: 'Password123' },
                  address: { type: 'string', example: '12 Lake View Road' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Registration successful' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive JWT token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@toyverse.demo' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        tags: ['Auth'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile' }
        }
      },
      put: {
        summary: 'Update current user profile',
        tags: ['Auth'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Profile updated' }
        }
      }
    },
    '/products': {
      get: {
        summary: 'List products (search, filter, sort, paginate)',
        tags: ['Products'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['popular', 'price-low', 'price-high', 'newest', 'rating'] } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'List of products' }
        }
      },
      post: {
        summary: 'Create a new product (Admin)',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Product created successfully' }
        }
      }
    },
    '/orders': {
      get: {
        summary: 'List all orders (Admin)',
        tags: ['Orders'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of all orders' }
        }
      },
      post: {
        summary: 'Place an order with atomic stock deduction',
        tags: ['Orders'],
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Order created successfully' }
        }
      }
    },
    '/orders/my-orders': {
      get: {
        summary: 'Get customer order history',
        tags: ['Orders'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of customer orders' }
        }
      }
    },
    '/stock/movements': {
      get: {
        summary: 'Query stock movement audit ledger (Admin)',
        tags: ['Stock'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Stock movement ledger' }
        }
      }
    },
    '/stock/low': {
      get: {
        summary: 'Get low-stock alert items (Admin)',
        tags: ['Stock'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Low stock items' }
        }
      }
    },
    '/stock/adjust': {
      post: {
        summary: 'Adjust inventory stock in or out (Admin)',
        tags: ['Stock'],
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Stock updated' }
        }
      }
    },
    '/dashboard': {
      get: {
        summary: 'Get dashboard KPIs and charts data (Admin)',
        tags: ['Dashboard'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Store dashboard metrics' }
        }
      }
    },
    '/upload': {
      post: {
        summary: 'Upload product images (Admin)',
        tags: ['Upload'],
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Images uploaded successfully' }
        }
      }
    }
  }
};
