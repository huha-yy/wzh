package com.community.tools.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.PropertyValue;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.PriorityOrdered;
import org.springframework.core.ResolvableType;

@Configuration
public class MapperFactoryBeanObjectTypeAdjuster implements BeanFactoryPostProcessor, PriorityOrdered {
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        for (String name : beanFactory.getBeanDefinitionNames()) {
            BeanDefinition bd = beanFactory.getBeanDefinition(name);
            String beanClassName = bd.getBeanClassName();
            if ("org.mybatis.spring.mapper.MapperFactoryBean".equals(beanClassName)) {
                Object attr = bd.getAttribute("factoryBeanObjectType");
                boolean needsFix = (attr == null) || (attr instanceof String);
                if (needsFix) {
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
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
