# Transfer Base Example

```javascript  
import { Transfer } from '@/components';

const transferExample: React.FC = () => {
    const handleChange = (val) => {
        console.log('onChange ? ', val)
    }

    const handleSelectChange = (val) => {
        console.log('onSelectChange ? ', val)
    }

    return (
        <Transfer
            dataSource={[
                {
                    key: '1',
                    title: 'User 1',
                },
                {
                    key: '2',
                    title: 'User 2',
                },
                {
                    key: '3',
                    title: 'User 3',
                },
                {
                    key: '5',
                    title: 'User 5',
                },
                {
                    key: '6',
                    title: 'User 6',
                },
                {
                    key: '7',
                    title: 'User 7',
                },
                {
                    key: '8',
                    title: 'User 8',
                },
            ]}
            selectedKeys={['2', '1']}
            targetKeys={['7', '8', '1']}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
        />  
    )
}

export default transferExample;
```