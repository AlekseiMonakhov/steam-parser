import { useState } from 'react';

const usePagination = (initialItemsPerPage: number) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = initialItemsPerPage;

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
    };

    return {
        currentPage,
        handlePageChange,
        itemsPerPage,
        setCurrentPage
    };
};

export default usePagination;