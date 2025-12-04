package com.community.tools.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.PropertyValue;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.beans.factory.support.BeanDefinitionRegistryPostProcessor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.ResolvableType;

@Configuration
public class MapperFactoryBeanObjectTypeFix implements BeanDefinitionRegistryPostProcessor {
    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) throws BeansException {
        String[] names = registry.getBeanDefinitionNames();
        for (String name : names) {
            BeanDefinition bd = registry.getBeanDefinition(name);
            String beanClassName = bd.getBeanClassName();
            if ("org.mybatis.spring.mapper.MapperFactoryBean".equals(beanClassName)) {
                PropertyValue pv = bd.getPropertyValues().getPropertyValue("mapperInterface");
                if (pv != null) {
                    Object val = pv.getValue();
                    if (val instanceof Class<?>) {
                        bd.setAttribute("factoryBeanObjectType", ResolvableType.forClass((Class<?>) val));
                    } else if (val instanceof String) {
                        try {
                            Class<?> clazz = Class.forName((String) val);
                            bd.setAttribute("factoryBeanObjectType", ResolvableType.forClass(clazz));
                        } catch (ClassNotFoundException ignored) {
                        }
                    }
                }
            }
        }
    }

    @Override
    public void postProcessBeanFactory(org.springframework.beans.factory.config.ConfigurableListableBeanFactory beanFactory) throws BeansException {
    }
}
