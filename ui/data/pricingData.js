const pricingData = {
	title: 'Pricing Plans',
	subtitle: 'Choose the right plan for your team',
	plans: [
		{
			id: 'basic',
			label: 'Basic Plan',
			price: '49rs/month',
			description: 'Perfect for marketers / scale up business',
			features: [
				'Unlimited monthly emails',
				'1 seats',
				'Custom user permission',
				'Unlimited audience',
				'One website',
				'Email support first 30 days',
			],
			cta: 'Start Free Trial',
			highlight: false,
		},
		{
			id: 'popular',
			label: 'Popular Plan',
			price: '124rs/month',
			description: 'Perfect for marketers / scale up business',
			features: [
				'Unlimited monthly emails',
				'3 seats',
				'Custom user permission',
				'Unlimited audience',
				'Unlimited website',
				'Email support 24/7 priority',
			],
			cta: 'Start 7-days Free Trial',
			highlight: true,
		},
		{
			id: 'pro',
			label: 'Pro Plan',
			price: '299rs/month',
			description: 'Perfect for marketers / scale up business',
			features: [
				'Unlimited monthly emails',
				'Unlimited seats',
				'Custom user permission',
				'Unlimited audience',
				'Unlimited website',
				'Email support 24/7 priority',
			],
			cta: 'Start Free Trial',
			highlight: false,
		},
	],
};

export default pricingData;
