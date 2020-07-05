import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IProductRequest {
  product_id: string;
  price: number;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productsInfo = await this.productsRepository.findAllById(products);
    const productsToOrder: IProductRequest[] = [];

    const productsToUpdate = productsInfo.map(productInfo => {
      const productRequest = products.find(
        product => product.id === productInfo.id,
      );

      if (productRequest) {
        if (productRequest.quantity >= productInfo.quantity)
          throw new AppError('Insufficient product quantity');
        // eslint-disable-next-line no-param-reassign
        productInfo.quantity -= productRequest.quantity;

        productsToOrder.push({
          product_id: productRequest.id,
          price: productInfo.price,
          quantity: productRequest.quantity,
        });
      }

      return productInfo;
    });

    await this.productsRepository.updateQuantity(productsToUpdate);

    const order = await this.ordersRepository.create({
      customer,
      products: productsToOrder,
    });

    return order;
  }
}

export default CreateOrderService;
