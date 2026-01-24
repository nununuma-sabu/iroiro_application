#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <time.h> // 時間計測のために追加

// 比較関数（qsort用）
int compare_ints(const void *a, const void *b) {
    return (*(int *)a - *(int *)b);
}

// 配列の中身を入れ替える
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

// 配列の一部を逆順にする
void reverse(int arr[], int start, int end) {
    while (start < end) {
        swap(&arr[start], &arr[end]);
        start++;
        end--;
    }
}

// 次の順列を生成する関数
bool next_permutation(int arr[], int n) {
    int i = n - 2;
    while (i >= 0 && arr[i] >= arr[i + 1]) {
        i--;
    }

    if (i < 0) {
        return false;
    }

    int j = n - 1;
    while (arr[j] <= arr[i]) {
        j--;
    }

    swap(&arr[i], &arr[j]);
    reverse(arr, i + 1, n - 1);

    return true;
}

// 配列を出力する関数
void print_array(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");
}

// メイン処理：順列を生成してカウントする
long long generate_permutations(int arr[], int n) {
    qsort(arr, n, sizeof(int), compare_ints);

    long long count = 0;
    
    do {
        print_array(arr, n);
        count++;
    } while (next_permutation(arr, n));

    return count;
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <num1> <num2> ... <numN>\n", argv[0]);
        return 1;
    }

    int n = argc - 1;
    if (n > 13) {
        fprintf(stderr, "Warning: N=%d is large. Processing might take a long time.\n", n);
    }

    int *data = (int *)malloc(n * sizeof(int));
    if (data == NULL) {
        fprintf(stderr, "Memory allocation failed.\n");
        return 1;
    }

    for (int i = 0; i < n; i++) {
        data[i] = atoi(argv[i + 1]);
    }

    printf("--- Start Permutations (N=%d) ---\n", n);
    
    // --- 計測開始 ---
    clock_t start_time = clock();

    long long total_count = generate_permutations(data, n);

    // --- 計測終了 ---
    clock_t end_time = clock();
    double time_spent = (double)(end_time - start_time) / CLOCKS_PER_SEC;

    printf("--- End ---\n");
    printf("Total Permutations: %lld\n", total_count);
    printf("Processing Time   : %.6f sec\n", time_spent); // 処理時間を表示

    free(data);

    return 0;
}