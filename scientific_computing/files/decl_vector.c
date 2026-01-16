#include <petsc.h>

int main(int argc, char **argv)
{
	Mat A;
	Vec b; 
	int i; 
	int j[4] = {0, 1, 2, 3}; 
	double ab[4] = {7.0, 1.0, 2.0, 4.0};
	double aA[4][4] = {{1, 0, 4, 2}, 
										{2, 6, 1, 5}, 
										{0, 1, -1, -2},										
										{4, 3, -2, 1}};
	
	double *abb; // This will hold the values of b
	FILE *fid;
	PetscInitialize(&argc, &argv, NULL, "Create vector AND matrix\n");
	
	VecCreate(PETSC_COMM_WORLD, &b);
	VecSetSizes(b, PETSC_DECIDE, 4);
	VecSetFromOptions(b);
	VecSetValues(b, 4, j, ab, INSERT_VALUES);
	VecAssemblyBegin(b); VecAssemblyEnd(b);
	
	MatCreate(PETSC_COMM_WORLD, &A);
	MatSetSizes(A, PETSC_DECIDE, PETSC_DECIDE, 4, 4);
	MatSetFromOptions(A);
	MatSetUp(A);
	for (i = 0; i<4; i++)
	{
		MatSetValues(A, 1, &i, 4, j, aA[i], INSERT_VALUES);
	}
	MatAssemblyBegin(A, MAT_FINAL_ASSEMBLY); MatAssemblyEnd(A, MAT_FINAL_ASSEMBLY);
	
	//MatView(A, PETSC_VIEWER_STDOUT_WORLD);
	//VecView(b, PETSC_VIEWER_STDOUT_WORLD);
	
	fid = fopen("datafile.dat", "w");
	
	VecGetArray(b, &abb);
	for (i = 0; i<4; i++)
	{
		fprintf(fid, "%d\t%lf\n", i, abb[i]);
	}
	VecRestoreArray(b, &abb);
	fclose(fid);
	
	MatDestroy(&A);
	VecDestroy(&b);
	
	return PetscFinalize();
}
